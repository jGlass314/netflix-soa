const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient('redis://localhost:6379');

const contentAddr = 'http://localhost:1337';
const userAddr = 'http://localhost:1337';
const playerAddr = 'http://localhost:1337';

const router = new Router();
const BASE_URL = `/home`;

var inMemHome = {};
// var homeListings = {};
// Send init request for home page and set to cache
const getHomeListings = async () => {
  
  try {
    const getResponse = await axios.get(`${contentAddr}${BASE_URL}`)
    // console.log('/home get getResponse:', getResponse.data.homePage);
    homeListings = getResponse.data.homePage;
    inMemHome = await setHomeListingsToMem(getResponse.data.homePage);
    // console.log('getHomeListings inMemHome:', inMemHome);
    // setHomeListingsToCache(homeListings);
    console.log('metrics:', metrics);
  } catch (err) {
    console.error('/home get error:', err);
  }
}
setTimeout(() => getHomeListings(), 2*1000);
setInterval(() => getHomeListings(), 3*60*1000);

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    if (typeof ctx.request.body === 'object' &&
        ctx.request.body.homePage) {
        // reset homeListings
        // homeListings = ctx.request.body.homePage;
        inMemHome = await setHomeListingsToMem(ctx.request.body.homePage);
        // console.log('router.post inMemHome:', inMemHome);
        // setHomeListingsToCache(homeListings);
        console.log('metrics:', metrics);
        ctx.status = 201;
        ctx.body = {
          status: 'success',
          // data: result,
          message: 'home page posted.'
        };
    } else {
      console.error('POST /home error');
      ctx.status = 500;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    console.error('POST /home error:', err);
  }
})

var metrics = {
  cacheMissHomeSnippets: 0,
  cacheHitHomeSnippets: 0,
  inMemHomeSet: 0,
  inMemHomeGet: 0
};

router.get(`${BASE_URL}`,  async (ctx) => {
  // let startTime = Date.now();
  try {
    // console.log('ctx.query:', ctx.query);
    let returnObj = {};
    // get user-subscription info
    // check user:+userId cache
    let subInfo = await redisClient.hgetallAsync('user:' + ctx.query.userId);
    // on user+userId cache miss
    if(!subInfo) {
      subInfo = await axios.get(`${userAddr}/user/${ctx.query.userId}`);
      subInfo = subInfo.data.data;
      // console.log('subInfo.data.data from axios get:', subInfo);
      
      // add to user:+userId cache
      redisClient.hmsetAsync('user:' + ctx.query.userId, subInfo);
    } else {
      // console.log('subInfo was cached. looks like:', subInfo);
    }

    // check unfinished+userId cache
    let unfinishedIds = await redisClient.lrangeAsync('unfinished:' + ctx.query.userId, 0, -1);
    if(!unfinishedIds || !unfinishedIds.length) {
      // on unfinished+userId cache miss
      let unfinishedIdObjects = await axios.get(`${playerAddr}/unfinished/${ctx.query.userId}?limit=5`);
      unfinishedIdObjects = unfinishedIdObjects.data.data;
      // console.log('playerInfo.data.data from axios get:', unfinishedIdObjects);
      // add to unfinished+userId cache
      if(unfinishedIdObjects.length) {
        unfinishedIds = unfinishedIdObjects.map(obj => obj.videoId);
        unfinishedIds.unshift('unfinished:' + ctx.query.userId);
        redisClient.rpushAsync(unfinishedIds);
      }
      unfinishedIds.shift();
      // console.log('unfinishedIds added to cache:', unfinishedIds);
    } else {
      // console.log('unfinishedIds from cache:', unfinishedIds);
    }

    // check snippet+videoId cache for all videos in playerResult
    let unfinishedSnippets = [];
    let emptyIds = [];
    for(let id of unfinishedIds) {
      let snippet = await redisClient.hgetallAsync('snippet:' + id);
      if(!snippet) {
        // console.log('home router.get no snippet in unfinished');
        emptyIds.push(id);
      } else {
        snippet = hashToSnippet(snippet);
        unfinishedSnippets.push(snippet);
      }
    };
    // get emptySnippets
    if(emptyIds.length) {
      console.log('emptyIds:', emptyIds);
      let missingSnippets = await queries.multiGetSnippet(emptyIds);
      missingSnippets = missingSnippets.docs;
      // console.log('missingSnippets:', missingSnippets);
      missingSnippets.forEach(snippet => {
        // add to snippet+videoId cache
        console.log('missing snippet:', snippet._source);
        unfinishedSnippets.push(snippet._source);
        snippet._source = snippetToHash(snippet._source);
        redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
      })
    }

    // filter unfinished snippets
    unfinishedSnippets = unfinishedSnippets.filter(snippet => snippet.regions.includes(subInfo.region));
    returnObj._unfinished = unfinishedSnippets;

    metrics.inMemHomeGet++;
    // console.log('router.get inMemHome:', inMemHome);
    for(var genre in inMemHome) {
      // console.log(`inMemHome[${genre}][3]:${inMemHome[genre][3].videoId}`);
      returnObj[genre] = inMemHome[genre].filter(snippet => snippet.regions.includes(subInfo.region));
    }
    // console.log('returnObj:' , returnObj);
    // console.log('metrics:', metrics);
    ctx.status = 200;
    ctx.body = returnObj;
    
  } catch (err) {
    console.error(`Error on GET on /home?userId=${ctx.query.userId}:${err}`);
  }
  // console.log('time elapsed:', Date.now() - startTime);
})

const setHomeListingsToMem = async (homeListingIds) => {
  metrics.inMemHomeSet++;
  var inMemHomeSnippets = {};
  for(var genre in homeListingIds) {
    inMemHomeSnippets[genre] = [];
    var emptyIds = [];
    for(var listingIdx = 0; listingIdx < homeListingIds[genre].length; listingIdx++) {
      const id = homeListingIds[genre][listingIdx];
      var result = await redisClient.hgetallAsync('snippet:' + id);
      if(!result) {
        // console.log('null result looks like:', result, typeof result);
        emptyIds.push(id);
      } else {
        // console.log('setHomeListingsToMem: found', genre, 'result.videoId:', result.videoId, 'in cache');
        result = hashToSnippet(result);
      }
      inMemHomeSnippets[genre].push(result);
    }
    // console.log(`inMemHomeSnippets[${genre}]:`, inMemHomeSnippets[genre]);
    if(emptyIds.length) {
      // get snippets that aren't in the cache
      const remainingSnippets = await queries.multiGetSnippet(emptyIds);
      // console.log('remainingSnippets:', remainingSnippets);
      const remainingSnippetsDocs = remainingSnippets.docs;
      for(var i = 0; i < inMemHomeSnippets[genre].length; i++) {
        if(!inMemHomeSnippets[genre][i]) {
          inMemHomeSnippets[genre][i] = remainingSnippetsDocs.shift()._source;
          // set inMemHomeSnippets[genre][i] to cache
          // console.log(`inMemHomeSnippets[${genre}][${i}]:`, inMemHomeSnippets[genre][i]);
          const snippetHash = snippetToHash(inMemHomeSnippets[genre][i]);
          redisClient.hmsetAsync('snippet:' + inMemHomeSnippets[genre][i].videoId, snippetHash);
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
    // console.log(`deleteHomeListingFromMem: ${genre}, postdelete count: ${inMemHome[genre].length}`);
    redisClient.del('snippet:' + videoId);
  }
}

const updateHomeListing = async (videoId, regions) => {
  console.log('updateHomeListing:', videoId, regions, Object.keys(inMemHome));
  for(var genre in inMemHome) {
    console.log(genre,':', inMemHome[genre].length);
    for(var i = 0; i < inMemHome[genre].length; i++) {
      var snippet = inMemHome[genre][i];
      if(snippet.videoId === videoId) {
        console.log('pre-patch snippet:', genre, inMemHome[genre][i]);
        snippet.regions = regions;
        console.log('post-patch snippet:', genre, inMemHome[genre][i]);
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