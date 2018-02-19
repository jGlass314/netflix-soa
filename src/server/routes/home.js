const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient(process.env.REDIS_URL);

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
const userAddr = process.env.USERADDRESS;
const playerAddr = process.env.PLAYERADDRESS;

const router = new Router();
const BASE_URL = `/home`

var inMemHome = {};
// var homeListings = {};
/*
// Send init request for home page and set to cache
const getHomeListings = async () => { 
  try {
    var start = Date.now();
    const getResponse = await axios.get(`${contentAddr}${BASE_URL}`);
    statsdClient.timing(`.service.cfs${worker_id}.content.home.get.latency_ms`, Date.now() - start, 0.25);
    // console.log('/home get getResponse:', getResponse.data.homePage);
    homeListings = getResponse.data.homePage;
    inMemHome = await setHomeListingsToMem(getResponse.data.homePage);
    // console.log('getHomeListings inMemHome:', inMemHome);
    // setHomeListingsToCache(homeListings);
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.content.home.get`,1,0.25);
    console.error('/home get error:', err);
  }
}
setTimeout(() => getHomeListings(), 2*1000);
setInterval(() => getHomeListings(), 3*60*1000);
*/
router.post(`${BASE_URL}`, async (ctx) => {
  try {
    statsdClient.increment(`.service.cfs${worker_id}.home.post`,1,0.25);
    if (typeof ctx.request.body === 'object' &&
        ctx.request.body.homePage) {
        // reset homeListings
        inMemHome = await setHomeListingsToMem(ctx.request.body.homePage);
        // console.log('router.post inMemHome:', inMemHome);
        // setHomeListingsToCache(homeListings);
        ctx.status = 201;
        ctx.body = {
          status: 'success',
          // data: result,
          message: 'home page posted.'
        };
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.error.home.post`,1,0.25);
      console.error('POST /home error');
      ctx.status = 500;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.home.post`,1,0.25);
    console.error('POST /home error:', err);
  }
})

router.get(`${BASE_URL}`,  async (ctx) => {
  // let startTime = Date.now();
  try {
    var homeGetStartTime = Date.now();
    statsdClient.increment(`.service.cfs${worker_id}.home.get`,1,0.25);
    // console.log('ctx.query:', ctx.query);
    let returnObj = {};
    // get user-subscription info
    // check user:+userId cache
/*   var start = Date.now();
    let subInfo = await redisClient.hgetallAsync('user:' + ctx.query.userId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms', Date.now() - start, 0.25);
    // on user+userId cache miss
    if(!subInfo) {
      statsdClient.increment(`.service.cfs${worker_id}.home.get.user.cache_miss',1,0.25);
      start = Date.now();
      subInfo = await axios.get(`${userAddr}/user/${ctx.query.userId}`);
      statsdClient.timing(`.service.cfs${worker_id}.home.get.user.latency_ms', Date.now() - start, 0.25);
      subInfo = subInfo.data.data;
      // console.log('subInfo.data.data from axios get:', subInfo);
      
      // add to user:+userId cache
      start = Date.now();
      redisClient.hmsetAsync('user:' + ctx.query.userId, subInfo);
      statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms', Date.now() - start, 0.25);
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.home.get.user.cache_hit',1,0.25);
      // console.log('subInfo was cached. looks like:', subInfo);
    }
*//*
    // check unfinished+userId cache
    start = Date.now();
    let unfinishedIds = await redisClient.lrangeAsync('unfinished:' + ctx.query.userId, 0, -1);
    statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms', Date.now() - start, 0.25);
    if(!unfinishedIds || !unfinishedIds.length) {
      // on unfinished+userId cache miss
      statsdClient.increment(`.service.cfs${worker_id}.home.get.player.cache_miss',1,0.25);
      start = Date.now();
      let unfinishedIdObjects = await axios.get(`${playerAddr}/unfinished/${ctx.query.userId}?limit=5`);
      statsdClient.timing(`.service.cfs${worker_id}.home.get.player.latency_ms', Date.now() - start, 0.25);
      unfinishedIdObjects = unfinishedIdObjects.data.data;
      // console.log('playerInfo.data.data from axios get:', unfinishedIdObjects);
      // add to unfinished+userId cache
      if(unfinishedIdObjects.length) {
        unfinishedIds = unfinishedIdObjects.map(obj => obj.videoId);
        unfinishedIds.unshift('unfinished:' + ctx.query.userId);
        start = Date.now();
        redisClient.rpushAsync(unfinishedIds);
        statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms', Date.now() - start, 0.25);
      }
      unfinishedIds.shift();
      // console.log('unfinishedIds added to cache:', unfinishedIds);
    } else {
      statsdClient.increment(`.service.cfs${worker_id}.home.get.player.cache_hit',1,0.25);
      // console.log('unfinishedIds from cache:', unfinishedIds);
    }

    // check snippet+videoId cache for all videos in playerResult
    let unfinishedSnippets = [];
    let emptyIds = [];
    for(let id of unfinishedIds) {
      start = Date.now();
      let snippet = await redisClient.hgetallAsync('snippet:' + id);
      statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms', Date.now() - start, 0.25);
      if(!snippet) {
        statsdClient.increment(`.service.cfs${worker_id}.home.get.snippet.cache_miss',1,0.25);
        // console.log('home router.get no snippet in unfinished');
        emptyIds.push(id);
      } else {
        statsdClient.increment(`.service.cfs${worker_id}.home.get.snippet.cache_hit',1,0.25);
        snippet = hashToSnippet(snippet);
        unfinishedSnippets.push(snippet);
      }
    };
    // get emptySnippets
    if(emptyIds.length) {
      console.log('emptyIds:', emptyIds);
      start = Date.now();
      let missingSnippets = await queries.multiGetSnippet(emptyIds);
      statsdClient.timing(`.service.cfs${worker_id}.home.elasticsearch.multiget.latency_ms', Date.now() - start, 0.25);
      missingSnippets = missingSnippets.docs;
      console.log('missingSnippets:', missingSnippets);
      missingSnippets.forEach(snippet => {
        if(!snippet.found) {
          throw new Error('unfound snippet:', snippet);
        }

        // add to snippet+videoId cache
        console.log('missing snippet:', snippet._source);
        unfinishedSnippets.push(snippet._source);
        snippet._source = snippetToHash(snippet._source);
        start = Date.now();
        redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
        statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms', Date.now() - start, 0.25);
      })
    }

    // filter unfinished snippets
    unfinishedSnippets = unfinishedSnippets.filter(snippet => snippet.regions.includes(subInfo.region));
    returnObj._unfinished = unfinishedSnippets;
*/
    // console.log('router.get inMemHome:', inMemHome);
    for(var genre in inMemHome) {
      // console.log(`inMemHome[${genre}][3]:${inMemHome[genre][3].videoId}`);
      returnObj[genre] = inMemHome[genre].filter(snippet => snippet.regions.includes(subInfo.region));
    }
    ctx.status = 200;
    ctx.body = returnObj;
    statsdClient.timing(`.service.cfs${worker_id}.home.get`, Date.now() - homeGetStartTime, 0.25);
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.home.get`,1,0.25);
    console.error(`Error on GET on /home?userId=${ctx.query.userId}:${err}`);
  }
  // console.log('time elapsed:', Date.now() - startTime);
})

const setHomeListingsToMem = async (homeListingIds) => {
  var inMemHomeSnippets = {};
  var start;
  for(var genre in homeListingIds) {
    inMemHomeSnippets[genre] = [];
    var emptyIds = [];
    for(var listingIdx = 0; listingIdx < homeListingIds[genre].length; listingIdx++) {
      const id = homeListingIds[genre][listingIdx];
      start = Date.now();
      var result = await redisClient.hgetallAsync('snippet:' + id);
      statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms`, Date.now() - start, 0.25);
      if(!result) {
        statsdClient.increment(`.service.cfs${worker_id}.home.set.snippet.cache_miss`,1,0.25);
        // console.log('null result looks like:', result, typeof result);
        emptyIds.push(id);
      } else {
        statsdClient.increment(`.service.cfs${worker_id}.home.set.snippet.cache_hit`,1,0.25);
        // console.log('setHomeListingsToMem: found', genre, 'result.videoId:', result.videoId, 'in cache');
        result = hashToSnippet(result);
      }
      inMemHomeSnippets[genre].push(result);
    }
    // console.log(`inMemHomeSnippets[${genre}]:`, inMemHomeSnippets[genre]);
    if(emptyIds.length) {
      // get snippets that aren't in the cache
      start = Date.now();
      const remainingSnippets = await queries.multiGetSnippet(emptyIds);
      statsdClient.timing(`.service.cfs${worker_id}.home.elasticsearch.multiget.latency_ms`, Date.now() - start, 0.25);
      // console.log('remainingSnippets:', remainingSnippets);
      const remainingSnippetsDocs = remainingSnippets.docs;
      for(var i = 0; i < inMemHomeSnippets[genre].length; i++) {
        if(!inMemHomeSnippets[genre][i]) {
          inMemHomeSnippets[genre][i] = remainingSnippetsDocs.shift()._source;
          // set inMemHomeSnippets[genre][i] to cache
          // console.log(`inMemHomeSnippets[${genre}][${i}]:`, inMemHomeSnippets[genre][i]);
          const snippetHash = snippetToHash(inMemHomeSnippets[genre][i]);
          start = Date.now();
          redisClient.hmsetAsync('snippet:' + inMemHomeSnippets[genre][i].videoId, snippetHash);
          statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);
        }
      }
    }
  }
  // console.log('inMemHomeSnippets:', inMemHomeSnippets);
  return inMemHomeSnippets;
}

const deleteHomeListing = async (videoId) => {
  for(var genre in inMemHome) {
    // console.log(`deleteHomeListingFromMem: ${genre}, predelete count: ${inMemHome[genre].length}`);
    inMemHome[genre] = inMemHome[genre].filter(snippet => {
      return snippet.videoId !== videoId;
    });
    statsdClient.increment(`.service.cfs${worker_id}.home.delete`,1,0.25);
    // console.log(`deleteHomeListingFromMem: ${genre}, postdelete count: ${inMemHome[genre].length}`);
    var start = Date.now();
    redisClient.del('snippet:' + videoId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.delete.latency_ms`, Date.now() - start, 0.25);
  }
}

const updateHomeListing = async (videoId, regions) => {
  // console.log('updateHomeListing:', videoId, regions, Object.keys(inMemHome));
  statsdClient.increment(`.service.cfs${worker_id}.home.update`,1,0.25);
  for(var genre in inMemHome) {
    console.log(genre,':', inMemHome[genre].length);
    for(var i = 0; i < inMemHome[genre].length; i++) {
      var snippet = inMemHome[genre][i];
      if(snippet.videoId === videoId) {
        // console.log('pre-patch snippet:', genre, inMemHome[genre][i]);
        snippet.regions = regions;
        // console.log('post-patch snippet:', genre, inMemHome[genre][i]);
        break;
      }
    }
  }
}

const hashToSnippet = hash => {
  hash.regions = hash.regions.split('|');
  hash.genres = hash.genres.split('|');
  hash.cast = hash.cast.split('|');
  return hash;
}

const snippetToHash = object => {
  object.regions = object.regions.join('|');
  object.genres = object.genres.join('|');
  object.cast = object.cast.join('|');
  return object;
}

module.exports = {
  router,
  deleteHomeListing,
  updateHomeListing
};