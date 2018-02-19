const Router = require('koa-router');
const router = new Router();
const axios = require('axios');

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient(process.env.REDIS_URL);
const queries = require('../../database/queries/snippet');
const home = require('./home');
const search = require('./search');

require('dotenv').config()

const StatsD = require('node-statsd');
const statsdClient = new StatsD({
  host: 'statsd.hostedgraphite.com',
  port: 8125,
  prefix: process.env.HOSTEDGRAPHITE_APIKEY
});
let worker_id = '.worker_1';
if(process.env.REPLICA_NUMBER) {
  worker_id = `.worker_${process.env.REPLICA_NUMBER}`;
}

const contentAddr = process.env.CONTENTADDRESS;

const BASE_URL = `/content`;

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    statsdClient.increment(`.service.cfs${worker_id}.content.post`,1,0.25);
    // console.log('posting content to db:', ctx.request.body.videoId);
    const result = await queries.addSnippet(ctx.request.body);
    if (result.result === 'created' || result.result === 'updated') {
      console.log(`content ${result.result}: ${ctx.request.body.videoId}`);
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: result
      };
      // dump searchTerm cache
      var searchTerms = {};
      var cursor = 0;
      var start = Date.now();
      do {
        var reply = await redisClient.scanAsync(cursor, 'MATCH', 'searchTerm*', 'COUNT', 1000);
        cursor = reply[0];
        var keys = reply[1];
        keys.forEach(key => {
          searchTerms[key] = undefined;
        })
      } while (parseInt(cursor));
      statsdClient.timing(`.service.cfs${worker_id}.redis.scan.latency_ms`, Date.now() - start, 0.25);
      for(var entry in searchTerms) {
        redisClient.del(entry);
      }
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.error.content.post`,1,0.25);
      console.error('never posted content to db:', ctx.request.body.videoId);
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.content.post`,1,0.25);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
})

router.patch(`${BASE_URL}`, async (ctx) => {
  try {
    // update object in memory
    statsdClient.increment(`.service.cfs${worker_id}.content.patch`,1,0.25);
    // console.log('router patch ctx.request.body:', ctx.request.body);
    home.updateHomeListing(ctx.request.body.videoId, ctx.request.body.regions)
    // update object in database
    const result = await queries.updateSnippet(ctx.request.body);
    if (result.result === 'updated' || results.result === 'noop') {
      ctx.status = 202;
      ctx.body = {
        status: 'success',
        data: result
      };
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.error.content.patch`,1,0.25);
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.content.patch`,1,0.25);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
})

router.delete(`${BASE_URL}/:videoId`, async (ctx) => {
  try {
    // console.log('deleting snippet:', ctx.params.videoId);
    // delete snippet from home listings in memory
    statsdClient.increment(`.service.cfs${worker_id}.content.delete`,1,0.25);
    home.deleteHomeListing(ctx.params.videoId);
    // delete videoId from search results
    search.deleteSearchResult(ctx.params.videoId);
    // delete snippet from database
    const result = await queries.deleteSnippet(ctx.params.videoId);
    if (result.result === 'deleted') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: result
      };
    }
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.content.delete`,1,0.25);
    if(err.message === 'Not Found') {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That video does not exist.'
      };
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.error.content.delete`,1,0.25);
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: err.message || 'Sorry, an error has occurred.'
      };
    }
  }
})

router.get(`${BASE_URL}/:videoId`, async (ctx) => {
  try {
    // console.log('sending to', `${contentAddr}/content/${ctx.params.videoId}`);
    statsdClient.increment(`.service.cfs${worker_id}.content.get`,1,0.25);
    var start = Date.now();
    const response = await axios.get(`${contentAddr}/content/${ctx.params.videoId}`);
    statsdClient.timing(`.service.cfs${worker_id}.content.get.latency_ms`, Date.now() - start, 0.25);
    // console.log(`get ${contentAddr}/content/${ctx.params.videoId} response:${JSON.stringify(response.data)}`);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: response.data
    };
    
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.content.get`,1,0.25);
    console.error('error:', err);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})

module.exports = router;