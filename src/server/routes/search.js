const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');

const router = new Router();

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
    const searchResultIds = await redisClient.lrangeAsync('searchTerm:' + searchTerm, 0, -1);
    if(searchResultIds && searchResultIds.length) {
      // cache hit on search term
      // console.log('cache hit on:', searchTerm, 'ids:', searchResultIds);
      metrics.cacheHitSearchIds++;
      for(var i = 0; i < searchResultIds.length; i++) {
        var id = searchResultIds[i];
        var result = await redisClient.hgetallAsync('snippet:' + id)
        if(result) {
          metrics.cacheHitSearchSnippets++;
          result = hashToSnippet(result);
        }
        // console.log(result);
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
        // if no snippet
        } else {
          // get ids of each null snippet result
          // console.log('pushing', searchResultIds[index], 'to emptyIds');
          emptyIds.push(searchResultIds[index]);
        }
      })
      if(emptyIds.length) {
        // if there are null snippet results, get snippets by ID
        metrics.cacheMissSearchSnippets++;
        const remainingSnippets = await queries.multiGetSnippet(emptyIds);
        // console.log('remainingSnippets:', remainingSnippets.docs);
        for(var i = 0; i < remainingSnippets.docs.length; i++) {
          var snippet = remainingSnippets.docs[i];
          // console.log('remaining snippet._source:', snippet._source);
          finalSnippetResults.push(snippet._source);
          // prepare snippet for caching...
          snippet._source = snippetToHash(snippet._source);
          await redisClient.hmsetAsync('snippet:' + snippet._source.videoId, snippet._source);
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
        await redisClient.rpushAsync(foundVideoIds);
      }
    }

    // console.log('search got result:', results);
    console.log(metrics);
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


module.exports = router;