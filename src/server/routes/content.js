const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient('redis://localhost:6379');
const home = require('./home');
const search = require('./search');

// TODO: ***  CHANGE PORT IN PRODUCTION!!!  ***
const contentAddr = {ip:'http://localhost',port:1337};

const router = new Router();
const BASE_URL = `/content`;

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    const result = await queries.addSnippet(ctx.request.body);
    if (result.result === 'created' || result.result === 'updated') {
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: result
      };
      // dump searchTerm cache
      var searchTerms = {};
      var cursor = 0;
      do {
        var reply = await redisClient.scanAsync(cursor, 'MATCH', 'searchTerm*', 'COUNT', 1000);
        cursor = reply[0];
        var keys = reply[1];
        keys.forEach(key => {
          searchTerms[key] = undefined;
        })
      } while (parseInt(cursor));
      for(var entry in searchTerms) {
        redisClient.del(entry);
      }
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
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
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
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
    if(err.message === 'Not Found') {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That video does not exist.'
      };
    } else {
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
    const PORT = 1337;
    // console.log('sending to', `${contentAddr.ip}:${contentAddr.port}/content/${ctx.params.videoId}`);
    const response = await axios.get(`${contentAddr.ip}:${PcontentAddr.port}/content`, {
      params: {
        videoIds: [ctx.params.videoId]
      }
    });
    // console.log(`get ${contentAddr.ip}:${contentAddr.port}/content/${ctx.params.videoId} response:${JSON.stringify(response.data)}`);

    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: response.data
    };
  } catch (err) {
    console.error('error:', err);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})

module.exports = router;