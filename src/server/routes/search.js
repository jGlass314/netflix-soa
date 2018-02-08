const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');

const router = new Router();

const userAddr = 'http://localhost:1337';

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// const redisClient = redis.createClient('redis://hr-netflix-cfs-redis.jml4ht.0001.usw1.cache.amazonaws.com:6379');
const redisClient = redis.createClient('redis://localhost:6379');

const BASE_URL = '/search';

var metrics = {
  cacheMissSearchIds: 0,
  cacheMissSearchSnippets: 0,
  cacheHitSearchIds: 0,
  cacheHitSearchSnippets: 0
}

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    var searchTerm = ctx.request.body.q;
    var finalSnippetResults = [];
    var someSnippetResults = [];
    // let startTime = Date.now();
    // console.log('query string to get:', searchTerm);

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


    const searchResultIds = await redisClient.lrangeAsync('searchTerm:' + searchTerm, 0, -1);
    // console.log("searchResultIds:", searchResultIds);
    if(searchResultIds && searchResultIds.length) {
      // cache hit on search term
      // console.log('cache hit on:', searchTerm, 'ids:', searchResultIds);
      metrics.cacheHitSearchIds++;
      for(var i = 0; i < searchResultIds.length; i++) {
        var id = searchResultIds[i];

        // **TODO**: consider using Promise.all here instead of awaits.
          // make sure to wrap entire function in promise and return obj in resolve
        var result = await redisClient.hgetallAsync('snippet:' + id)
        if(result) {
          metrics.cacheHitSearchSnippets++;
          result = hashToSnippet(result);
        } else {
          metrics.cacheMissSearchSnippets++;
        }
        // console.log('cached result:', result);
        // either push valid snippet or null
        someSnippetResults.push(result);
      }
      var emptyIds = [];
      someSnippetResults.forEach((snippet, index) => {
        // console.log('someSnippetResults[', index, ']:', snippet);

        // if valid snippet
        if(snippet) {
          // console.log('cache hit on:', snippet);
          finalSnippetResults.push(snippet);
        // if no snippet in cache
        } else {
          // get ids of each null snippet result
          // console.log('pushing', searchResultIds[index], 'to emptyIds');
          emptyIds.push(searchResultIds[index]);
        }
      })
      if(emptyIds.length) {
        // if there are null snippet results, get snippets by ID
        const remainingSnippets = await queries.multiGetSnippet(emptyIds);
        // console.log('remainingSnippets:', remainingSnippets.docs);
        for(var i = 0; i < remainingSnippets.docs.length; i++) {
          var snippet = remainingSnippets.docs[i];
          // console.log('remaining snippet._source:', snippet._source);
          finalSnippetResults.push(snippet._source);
          // prepare snippet for caching...
          snippet._source = snippetToHash(snippet._source);
          redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
        }
      }
    } else {
      // search term wasn't in cache
      metrics.cacheMissSearchIds++;
      var foundVideoIds = [];
      const result = await queries.searchSnippet(searchTerm);
      // console.log('result.hits.hits:', result.hits.hits);
      finalSnippetResults = result.hits.hits.map(hit => {
        foundVideoIds.push(hit._source.videoId);
        return hit._source;
      })
      // console.log('foundVideoIds:', foundVideoIds);
      // console.log('finalSnippetResults:', finalSnippetResults);
      if(foundVideoIds.length) {
        foundVideoIds.unshift('searchTerm:' + searchTerm);
        redisClient.rpushAsync(foundVideoIds);
      }
    }

    // filter search result snippets by region
    finalSnippetResults = finalSnippetResults.filter(snippet => snippet.regions.includes(subInfo.region));

    // console.log('search got result:', results);
    console.log('metrics:', metrics);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: finalSnippetResults
    };
    // console.log('time elapsed:', Date.now() - startTime);
  } catch (err) {
    console.error('search error:', err);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
});

const deleteSearchResult = async (videoId) => {
  var scanEntries = [];
  var cursor = 0;
  do {
    var reply = await redisClient.scanAsync (cursor, 'MATCH', 'searchTerm*');
    cursor = reply[0];
    var keys = reply[1];
    keys.forEach(key => {
      scanEntries.push(key);
    })
  } while (parseInt(cursor));
  // delete from all search results
  for(var entry of scanEntries) {
    redisClient.lremAsync(entry, -1, videoId);
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
  deleteSearchResult
}