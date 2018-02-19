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
const userAddr = process.env.USERADDRESS;
const BASE_URL = '/user';

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    // console.log('/user POST ctx.request.body.userId:', ctx.request.body.userId);
    statsdClient.increment(`.service.cfs${worker_id}.user.post`,1,0.25);
    // console.log('user pre-set to cache:', await redisClient.hgetallAsync('user:' + ctx.request.body.userId));
    var start = Date.now();
    redisClient.hmsetAsync('user:' + ctx.request.body.userId, {
      subscriptionStatus: ctx.request.body.subscriptionStatus,
      region: ctx.request.body.region
    });
    statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);
    
    // console.log('user post-set to cache:', await redisClient.hgetallAsync('user:' + ctx.request.body.userId));
    ctx.status = 201;
    ctx.body = {
      status: 'success',
      message: `sub info for user ${ctx.request.body.userId} posted`
    };
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.user.post`,1,0.25);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
})


module.exports = router;