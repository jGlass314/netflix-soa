const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');
const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient('redis://localhost');

const contentAddr = 'http://localhost:1337';
const userAddr = 'http://localhost:1338';
const playerAddr = 'http://localhost:1339';

const router = new Router();
const BASE_URL = `/home`;

var homeListings = {};

// Send init request for home page and push to cache
// TODO: ADD RESPONSE TO MEMORY!!!

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    if (typeof ctx.request.body === 'object' &&
        ctx.request.body.homePage) {
        // reset homeListings
        homeListings = ctx.request.body.homePage;
        console.log('homeListings:', homeListings);
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        console.log('*********************************************************************************');
        ctx.status = 201;
        ctx.body = {
          status: 'success',
          // data: result,
          message: 'home page posted.'
        };
        // // TODO: get all videoIds and ensure their snippets and full content are in cache
        // // **NOTE**: Messaging works. Just need to add in gets and adds to caches
        // let homeVideoIds = {};
        // for(var genre in homeListings) {
        //   homeListings[genre].forEach(vid => {
        //     homeVideoIds[vid] = true;
        //   });
        // }
        // // TODO: to speed things up, get arrays of vids not in each cache and do bulk lookups
        // for(let vid in homeVideoIds) {
        //   // check vid snippet and full content are in cache
          
        //   // TODO: check if snippet is in cache
        //   // on snippet cache miss, get from elasticSearch
        //   let result = await queries.getSnippet(vid);
        //   console.log('snippet result for vid:', vid, 'result:', result._source);
        //   // TODO: add to cache

        //   // TODO: check if full content is in cache
        //   // on full content cache miss, get from content service
        //   result = await axios.get(`${contentAddr}/content/${vid}`);
        //   console.log('full content result for vid:', vid, 'result:', result.data.data);
        //   // TODO: add to cache
        // }
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

router.get(`${BASE_URL}/:userId`,  async (ctx) => {
  // let startTime = Date.now();
  try {
    
    let returnObj = {};

    // get user-subscription info
    // TODO: check user+userId cache

    // on user+userId cache miss
    // let userResult = await axios.get(`${userAddr}/user/${ctx.params.userId}`);
    // TODO: add to user+userId cache

    // TODO: check unfinished+userId cache

    // on unfinished+userId cache miss
    // let playerResult = await axios.get(`${playerAddr}/unfinished/${ctx.params.userId}`);
    // TODO: add to unfinished+userId cache

    // TODO: check snippet+videoId cache for all videos in playerResult
    returnObj._unfinished = [];
    // {
      // on snippet+videoId cache miss
      // let snippetResult = await queries.getSnippet(vid);
      // TODO: add to snippet+videoId cache

      // returnObj._unfinished.push(snippetResult);
    // }

    for(var genre in homeListings) {
      let docList = [];
      returnObj[genre] = [];
      for(var i = 0; i < homeListings[genre].length; i++) {
        docList.push(homeListings[genre][i]);
        // TODO: check snippet+videoId cache for all videos in homeListings

        // on snippet+videoId cache miss
      }

      let snippetResults = await queries.multiGetSnippet(docList);
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('*********************************************************************************');
      // console.log('for multiGetSnippet [genre]:', genre,'element count:', snippetResults.docs.length);
      for(var i = 0; i < snippetResults.docs.length; i++) {
        // console.log('multiGetSnippet results[',genre,']:', snippetResults.docs[i]._source);
        returnObj[genre].push(snippetResults.docs[i]);
      }
    }
    
    ctx.status = 200;
    ctx.body = returnObj;
    
  } catch (err) {
    console.error('GET on /home/', ctx.params.userId, ':', err);
  }
  // console.log('time elapsed:', Date.now() - startTime);
})

module.exports = {
  router,
  homeListings
};