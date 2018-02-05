const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient('redis://localhost:6379');

const contentAddr = 'http://localhost:1337';
const userAddr = 'http://localhost:1338';
const playerAddr = 'http://localhost:1339';

const router = new Router();
const BASE_URL = `/home`;

var inMemHome = {};
var homeListings = {};
// Send init request for home page and set to cache
const getHomeListings = async () => {
  
  try {
    const getResponse = await axios.get(`${contentAddr}${BASE_URL}`)
    // console.log('/home get getResponse:', getResponse.data.homePage);
    homeListings = getResponse.data.homePage;
    // inMemHome = await setHomeListingsToMem(getResponse.data.homePage);
    // console.log('getHomeListings inMemHome:', inMemHome);
    setHomeListingsToCache(homeListings);
  } catch (err) {
    console.error('/home get error:', err);
  }
}
setTimeout(() => getHomeListings(), 2*1000);

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    if (typeof ctx.request.body === 'object' &&
        ctx.request.body.homePage) {
        // reset homeListings
        homeListings = ctx.request.body.homePage;
        // inMemHome = await setHomeListingsToMem(ctx.request.body.homePage);
        // console.log('router.post inMemHome:', inMemHome);
        setHomeListingsToCache(homeListings);

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

router.get(`${BASE_URL}/`,  async (ctx) => {
  // let startTime = Date.now();
  try {
    // console.log('ctx.query:', ctx.query);
    
    let returnObj = {};

    // get user-subscription info
    // TODO: check user+userId cache

    // on user+userId cache miss
    // let userResult = await axios.get(`${userAddr}/user/${ctx.query.userId}`);
    // TODO: add to user+userId cache

    // TODO: check unfinished+userId cache

    // on unfinished+userId cache miss
    // let playerResult = await axios.get(`${playerAddr}/unfinished/${ctx.query.userId}`);
    // TODO: add to unfinished+userId cache

    // TODO: check snippet+videoId cache for all videos in playerResult
    returnObj._unfinished = [];
    // {
      // on snippet+videoId cache miss
      // let snippetResult = await queries.getSnippet(vid);
      // TODO: add to snippet+videoId cache

      // returnObj._unfinished.push(snippetResult);
    // }
    var homeListings = await getHomeListingsFromCache(ctx.query);
    for(var genre in homeListings) {
      returnObj[genre] = homeListings[genre];
    }
    // metrics.inMemHomeGet++;
    // console.log('router.get inMemHome:', inMemHome);
    // for(var genre in inMemHome) {
    //   returnObj[genre] = inMemHome[genre];
    // }
    // console.log('returnObj:' , returnObj);
    console.log('metrics:', metrics);
    ctx.status = 200;
    ctx.body = returnObj;
    
  } catch (err) {
    console.error('Error on GET on /home/', ctx.query.userId, ':', err);
  }
  // console.log('time elapsed:', Date.now() - startTime);
})

const setHomeListingsToCache = async homeListings => {
  // set homeListing Ids to cache
  var homeListingsCacheEntry = {};
  var homeListingIds = [];
  for(var genre in homeListings) {
    homeListingsCacheEntry[genre] = homeListings[genre].join('|');
    homeListings[genre].forEach(id => {
      homeListingIds.push(id);
    })
  }
  // console.log('setHomeListingsToCache:', homeListingsCacheEntry);
  await redisClient.del('home');
  const redisResponse = await redisClient.hmsetAsync('home', homeListingsCacheEntry)
  // console.log('homeListings added to cache:', redisResponse);

  // for each homeListing Id, set snippet to cache
  var emptyIds = [];
  for(var listingIdx = 0; listingIdx < homeListingIds.length; listingIdx++) {
    var id = homeListingIds[listingIdx];
    const result = await redisClient.hgetallAsync('snippet:' + id)
    if(!result) {
      emptyIds.push(id);
    }
    const remainingSnippets = await queries.multiGetSnippet(emptyIds);
    // console.log('remainingSnippets:', remainingSnippets.docs);
    for(var i = 0; i < remainingSnippets.docs.length; i++) {
      var snippet = remainingSnippets.docs[i];
      // console.log('remaining snippet._source:', snippet._source);
      // prepare snippet for caching...
      if(snippet.found) {
        snippet._source = snippetToHash(snippet._source);
        await redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
      }
    }
  }
}

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
        emptyIds.push(id);
      } else {
        result = hashToSnippet(result);
      }
      inMemHomeSnippets[genre].push(result);
    }
    // console.log(`inMemHomeSnippets[${genre}]:`, inMemHomeSnippets[genre]);
    if(emptyIds.length) {
      // get snippets that aren't in the cache
      const remainingSnippets = await queries.multiGetSnippet(emptyIds);
      const remainingSnippetsDocs = remainingSnippets.docs;
      for(var i = 0; i < inMemHomeSnippets[genre].length; i++) {
        if(!inMemHomeSnippets[genre][i]) {
          inMemHomeSnippets[genre][i] = remainingSnippetsDocs.shift()._source;
          // set inMemHomeSnippets[genre][i] to cache
          console.log(`inMemHomeSnippets[${genre}][${i}]:`, inMemHomeSnippets[genre][i]);
          const snippetHash = snippetToHash(inMemHomeSnippets[genre][i]);
          redisClient.hmsetAsync('snippet:' + inMemHomeSnippets[genre][i].videoId, snippetHash);
        }
      }
    }
  }
  // console.log('inMemHomeSnippets:', inMemHomeSnippets);
  return inMemHomeSnippets;
}

const getHomeListingsFromCache = async (params) => {
  // console.log('getHomeListingsFromCache params:', params);
  var homeListingIds = await redisClient.hgetallAsync('home');
  // console.log('getHomeListingsFromCache:', homeListingIds);
  // console.log('keys:', Object.keys(homeListingIds));
  var homeListings = {}
  // var count = 0;
  var genreArr = params.genre ? [params.genre] : Object.keys(homeListingIds);
  // console.log('genreArray:', genreArr);
  for(var genreIdx = 0; genreIdx < genreArr.length; genreIdx++) {
    const genre = genreArr[genreIdx];
    // console.log(`homeListingIds[${genre}]:${homeListingIds[genre]}`);
    homeListingIds[genre] = homeListingIds[genre].split('|');
    homeListings[genre] = [];

    // get snippets from cache
    var emptyIds = [];
    var missingIdxs = [];
    var offset = params.offset ? params.offset % homeListingIds[genre].length : 0;
    var maxLength = (offset + (params.limit ? params.limit : 20)) % homeListingIds[genre].length;
    for(var listingIdx = offset; listingIdx < maxLength; listingIdx++) {
      var id = homeListingIds[genre][listingIdx];
      var result = await redisClient.hgetallAsync('snippet:' + id);
      if(!result) {
        emptyIds.push(id);
        missingIdxs.push(listingIdx);
      } else {
        metrics.cacheHitHomeSnippets++;
        result = hashToSnippet(result);
      }
      // either push valid snippet or null
      homeListings[genre].push(result);
    }
    if(emptyIds.length) {
      metrics.cacheMissHomeSnippets++;
      const remainingSnippets = await queries.multiGetSnippet(emptyIds);
      // console.log('remainingSnippets:', remainingSnippets.docs);
      for(var i = 0; i < remainingSnippets.docs.length; i++) {
        var snippet = remainingSnippets.docs[i];
        // console.log('remaining snippet:', snippet);
        if(snippet.found) {
          homeListings[genre][missingIdxs[0]] = snippet._source;
          missingIdxs.shift();
          // prepare snippet for caching...
          snippet._source = snippetToHash(snippet._source);
          redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
        }
      }
    }
  }
  // console.log('homeListings:', homeListings);
  return homeListings;
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
  router
};