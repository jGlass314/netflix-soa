const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');

// TODO: ***  CHANGE PORT IN PRODUCTION!!!  ***
const contentAddr = {ip:'http://localhost',port:1337};

const router = new Router();
const BASE_URL = `/content`;

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    const result = await queries.addSnippet(ctx.request.body);
    if (result.result === 'created' || result.result === 'updated') {
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: result
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    console.log(err)
  }
})

router.patch(`${BASE_URL}`, async (ctx) => {
  try {
    const result = await queries.updateSnippet(ctx.request.body);
    if (result.result === 'updated' || results.result === 'noop') {
      ctx.status = 202;
      ctx.body = {
        status: 'success',
        data: result
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    console.log(err)
  }
})

router.delete(`${BASE_URL}/:videoId`, async (ctx) => {
  try {
    // console.log('videoId to delete:', ctx.params.videoId);
    const result = await queries.deleteSnippet(ctx.params.videoId);
    if (result.result === 'deleted') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: result
      };
    }
  } catch (err) {
    if(err.message === 'Not Found') {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That video does not exist.'
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: err.message || 'Sorry, an error has occurred.'
      };
  }
  }
})

router.get(`${BASE_URL}/:videoId`, async (ctx) => {
  try {
    // console.log('videoId to get:', ctx.params.videoId);
    // TODO: Check Redis cache
    
    // on failed cache lookup...
    // TODO: Send array of videoIds for all videoIds on the page
      // so everything in home that's not cached and everything in unwatched that's not cached
      // add them all to the cache, and then respond with the full content of that one video

    
    const PORT = 1337;
    // console.log('sending to', `${contentAddr.ip}:${contentAddr.port}/content/${ctx.params.videoId}`);
    const response = await axios.get(`${contentAddr.ip}:${PcontentAddr.port}/content`, {
      params: {
        videoIds: [ctx.params.videoId]
      }
    });
    // console.log(`get ${contentAddr.ip}:${contentAddr.port}/content/${ctx.params.videoId} response:${JSON.stringify(response.data)}`);
    
    // TODO: Store response data in cache
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: response.data
    };
  } catch (err) {
    console.error('error:', err);
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})

module.exports = router;