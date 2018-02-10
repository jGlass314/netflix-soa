const Router = require('koa-router');
const axios = require('axios');

const router = new Router();

const userAddr = 'http://localhost:1337';

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// const redisClient = redis.createClient('redis://hr-netflix-cfs-redis.jml4ht.0001.usw1.cache.amazonaws.com:6379');
const redisClient = redis.createClient('redis://localhost:6379');

const BASE_URL = '/user';

router.post(`${BASE_URL}`, async (ctx) => {
  try {
      // console.log('user pre-set to cache:', await redisClient.hgetallAsync('user:' + ctx.request.body.userId));
      redisClient.hmsetAsync('user:' + ctx.request.body.userId, {
        subscriptionStatus: ctx.request.body.subscriptionStatus,
        region: ctx.request.body.region
      });
      // console.log('user post-set to cache:', await redisClient.hgetallAsync('user:' + ctx.request.body.userId));
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        message: `sub info for user ${ctx.request.body.userId} posted`
      };
    
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
})


module.exports = router;