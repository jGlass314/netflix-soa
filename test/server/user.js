const Router = require('koa-router');
const axios = require('axios');
const faker = require('faker');

const router = new Router();
const CFS_ADDRESS = 'http://localhost:3000';
const BASE_URL_USER = `/user`;

router.get(`${BASE_URL_USER}/:userId`, async (ctx) => {
  try {
    // console.log('userId to USER service GET:', ctx.params.userId);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: {
        userId: ctx.params.userId,
        subscriptionStatus: 'active',
        region: 'Norway'
      }
    };
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
});

// update user 123
var deleteIterationCount = 0
var interval = setInterval(() => {
  if(deleteIterationCount++ >= 1) {
    clearInterval(interval);
    return;
  }
  // get homepage for userId 123
  axios.post(`${CFS_ADDRESS}${BASE_URL_USER}`, {
    userId: 123,
    subscriptionStatus: 'expired',
    region: 'Sweden'
  })
  .then(response => {
    // console.log('/unfinished POST response:', response.data);
  })
  .catch(err => {
    console.error('/unfinished POST error:', err);
  })
}, 12*1000);

module.exports = router;