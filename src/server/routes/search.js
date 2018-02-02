const Router = require('koa-router');
const axios = require('axios');
const queries = require('../../database/queries/snippet');

const router = new Router();
const BASE_URL = '/search';

router.post(`${BASE_URL}`, async (ctx) => {
  try {
    // let startTime = Date.now();
    // console.log('query string to get:', ctx.request.body.q);
  
    const result = await queries.searchSnippet(ctx.request.body.q);
    
    var results = result.hits.hits.map(hit => {
      return hit._source;
    })

    // console.log('search got result:', results);
    // TODO: Store response data in cache
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: results
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

module.exports = router;