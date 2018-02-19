const Router = require('koa-router');
const router = new Router();
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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

const redisClient = redis.createClient(process.env.REDIS_URL);

const BASE_URL = '/unfinished';

router.post(`${BASE_URL}/:userId`, async (ctx) => {
  try {
    // console.log('userId in unfinished POST:', ctx.params.userId);
    // delete unfinished videos from cache
    statsdClient.increment(`.service.cfs${worker_id}.player.post`,1,0.25);
    var start = Date.now();
    await redisClient.del('unfinished:' + ctx.params.userId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.delete.latency_ms`, Date.now() - start, 0.25);
    let unfinishedIds = ctx.request.body.videoIds;
    // console.log('post of unfinished Ids for user:', ctx.params.userId, unfinishedIds);
    unfinishedIds.unshift('unfinished:' + ctx.params.userId);
    start = Date.now();
    await redisClient.rpushAsync(unfinishedIds);
    statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);

    ctx.status = 201;
    ctx.body = {
      status: 'success',
      message: `posted unfinished videos for user ${ctx.params.userId}`
    };
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.player.post`,1,0.25);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
});

router.delete(`${BASE_URL}/:userId/:videoId`, async (ctx) => {
  try {
    statsdClient.increment(`.service.cfs${worker_id}.player.delete`,1,0.25);
    var start = Date.now();
    redisClient.lremAsync('unfinished:' + ctx.params.userId, -1, ctx.params.videoId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms`, Date.now() - start, 0.25);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      message: `deleted unfinished video ${ctx.params.videoId} for user ${ctx.params.userId}`
    };
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.player.delete`,1,0.25);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
})

module.exports = router;