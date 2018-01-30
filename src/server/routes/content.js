const Router = require('koa-router');
const queries = require('../../database/queries/snippet');

const router = new Router();
const BASE_URL = `/content`;

router.get(BASE_URL, async (ctx) => {
  try {
    const snippets = await queries.getAllSnippets();
    ctx.body = {
      status: 'success',
      data: snippets
    };
  } catch (err) {
    console.log(err)
  }
})

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    const result = await queries.addSnippet(ctx.request.body);
    console.log('post result:', result);
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
    console.log('videoId to delete:', ctx.params.videoId);
    const result = await queries.deleteSnippet(ctx.params.videoId);
    console.log('delete result:', result);
    if (result.result === 'deleted') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: result
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That movie does not exist.'
      };
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})


module.exports = router;