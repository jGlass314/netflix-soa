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

const BASE_URL = '/unfinished';

router.post(`${BASE_URL}/:userId`, async (ctx) => {
  try {
    // console.log('userId in unfinished POST:', ctx.params.userId);
    // delete unfinished videos from cache
    redisClient.del('unfinished:' + ctx.params.userId);
    let unfinishedIds = ctx.request.body.videoIds;
    // console.log('post of unfinished Ids:', unfinishedIds);
    unfinishedIds.unshift('unfinished:' + ctx.params.userId);
    redisClient.rpushAsync(unfinishedIds);

    ctx.status = 200;
    ctx.body = {
      status: 'success'
    };
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
});

router.delete(`${BASE_URL}/:userId/:videoId`, async (ctx) => {
  try {
    redisClient.lremAsync('unfinished:' + ctx.params.userId, -1, ctx.params.videoId);
    ctx.status = 200;
    ctx.body = {
      status: 'success'
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