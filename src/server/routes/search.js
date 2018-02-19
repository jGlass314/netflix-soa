const Router = require('koa-router');
const axios = require('axios');
const router = new Router();
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const queries = require('../../database/queries/snippet');

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

const userAddr = process.env.USERADDRESS;
const redisClient = redis.createClient(process.env.REDIS_URL);

const BASE_URL = '/search';

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    var searchPostStartTime = Date.now();
    statsdClient.increment(`.service.cfs${worker_id}.search.post`,1,0.25);
    var searchTerm = ctx.request.body.q;
    var finalSnippetResults = [];
    var someSnippetResults = [];
    // let startTime = Date.now();
    // console.log('query string to get:', searchTerm);

    // get user-subscription info
    // check user:+userId cache
/*    var start = Date.now();
    let subInfo = await redisClient.hgetallAsync('user:' + ctx.query.userId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms`, Date.now() - start, 0.25);
    
    // on user+userId cache miss
    if(!subInfo) {
      start = Date.now();
      subInfo = await axios.get(`${userAddr}/user/${ctx.query.userId}`);
      statsdClient.timing(`.service.cfs${worker_id}.user.get.latency_ms`, Date.now() - start, 0.25);
      subInfo = subInfo.data.data;
      // console.log('subInfo.data.data from axios get:', subInfo);
      
      // add to user:+userId cache
      start = Date.now();
      redisClient.hmsetAsync('user:' + ctx.query.userId, subInfo);
      statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);
    } else {
      // console.log('subInfo was cached. looks like:', subInfo);
    }
*/  start = Date.now();
    const searchResultIds = await redisClient.lrangeAsync('searchTerm:' + searchTerm, 0, -1);
    statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms`, Date.now() - start, 0.25);
   
    // console.log("searchResultIds:", searchResultIds);
    if(searchResultIds && searchResultIds.length) {
      // cache hit on search term
      // console.log('cache hit on:', searchTerm, 'ids:', searchResultIds);
      statsdClient.increment(`.service.cfs${worker_id}.search.post.searchterm.cache_hit`,1,0.25);
      for(var i = 0; i < searchResultIds.length; i++) {
        var id = searchResultIds[i];

        // **TODO**: consider using Promise.all here instead of awaits.
          // make sure to wrap entire function in promise and return obj in resolve
        start = Date.now();
        var result = await redisClient.hgetallAsync('snippet:' + id)
        statsdClient.timing(`.service.cfs${worker_id}.redis.get.latency_ms`, Date.now() - start, 0.25);
        if(result) {
          statsdClient.increment(`.service.cfs${worker_id}.search.post.snippet.cache_hit`,1,0.25);
          result = hashToSnippet(result);
        } else {
          statsdClient.increment(`.service.cfs${worker_id}.search.post.snippet.cache_miss`,1,0.25);
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
        start = Date.now();
        const remainingSnippets = await queries.multiGetSnippet(emptyIds);
        statsdClient.timing(`.service.cfs${worker_id}.home.elasticsearch.multiget.latency_ms`, Date.now() - start, 0.25);
        // console.log('remainingSnippets:', remainingSnippets.docs);
        for(var i = 0; i < remainingSnippets.docs.length; i++) {
          var snippet = remainingSnippets.docs[i];
          // console.log('remaining snippet._source:', snippet._source);
          finalSnippetResults.push(snippet._source);
          // prepare snippet for caching...
          snippet._source = snippetToHash(snippet._source);
          start = Date.now();
          redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
          statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);
        }
      }
    } else {
      // search term wasn't in cache
      console.log('cache miss on:', searchTerm);
      statsdClient.increment(`.service.cfs${worker_id}.search.post.searchterm.cache_miss`,1,0.25);
      var foundVideoIds = [];
      start = Date.now();
      const result = await queries.searchSnippet(searchTerm);
      statsdClient.timing(`.service.cfs${worker_id}.home.elasticsearch.search.latency_ms`, Date.now() - start, 0.25);
      // console.log('result.hits.hits:', result.hits.hits);
      finalSnippetResults = result.hits.hits.map(hit => {
        foundVideoIds.push(hit._source.videoId);
        return hit._source;
      })
      // console.log('foundVideoIds:', foundVideoIds);
      // console.log('finalSnippetResults:', finalSnippetResults);
      if(foundVideoIds.length) {
        foundVideoIds.unshift('searchTerm:' + searchTerm);
        start = Date.now();
        redisClient.rpushAsync(foundVideoIds);
        statsdClient.timing(`.service.cfs${worker_id}.redis.set.latency_ms`, Date.now() - start, 0.25);
        console.log('cache miss on:', searchTerm, 'pushed to cache:', foundVideoIds);
      }
    }

/*    // filter search result snippets by region
    finalSnippetResults = finalSnippetResults.filter(snippet => snippet.regions.includes(subInfo.region));
*/
    // console.log('search got result:', results);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: finalSnippetResults
    };
    statsdClient.timing(`.service.cfs${worker_id}.search.post`, Date.now() - searchPostStartTime, 0.25);
    // console.log('time elapsed:', Date.now() - startTime);
  } catch (err) {
    statsdClient.increment(`.service.cfs${worker_id}.error.search.post`,1,0.25);
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
  var start = Date.now();
  do {
    var reply = await redisClient.scanAsync (cursor, 'MATCH', 'searchTerm*');
    cursor = reply[0];
    var keys = reply[1];
    keys.forEach(key => {
      scanEntries.push(key);
    })
  } while (parseInt(cursor));
  statsdClient.timing(`.service.cfs${worker_id}.redis.scan.latency_ms`, Date.now() - start, 0.25);
  // delete from all search results
  for(var entry of scanEntries) {
    start = Date.now();
    redisClient.lremAsync(entry, -1, videoId);
    statsdClient.timing(`.service.cfs${worker_id}.redis.delete.latency_ms`, Date.now() - start, 0.25);
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