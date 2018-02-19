const Router = require('koa-router');
const axios = require('axios');
const faker = require('faker');
require('dotenv').config()
const router = new Router();
const BASE_URL_UNFINISHED = `/unfinished`;
const CFS_ADDRESS = process.env.CFSADDRESS;

const unwatchedIds = [
  "12086cd5-d33a-4da9-863d-de97381ad601",
  "4f311206-a3aa-4c99-919d-068373fb820d",
  "9d56a21d-e288-4e16-8350-7c2905e866df",
  "93ec18a6-dd54-4b85-ace8-0fd6c11bb6bc",
  "27fd2650-5b29-458f-8c2c-28e2a8a93b00"
];

router.get(`${BASE_URL_UNFINISHED}/:userId`, async (ctx) => {
  try {
    console.log('userId to PLAYER service GET:', ctx.params.userId, ctx.query);
    let plays = [];
    for(var i = 0; i < unwatchedIds.length && i < parseInt(ctx.query.limit); i++) {
      plays.push({
        userId: ctx.params.userId,
        videoId: unwatchedIds[i],
        secondsWatched: 0
      });
    }
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: plays
    };
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})

// delete unplayed video for user 123
// var deleteIterationCount = 0
// var interval = setInterval(() => {
//   if(deleteIterationCount++ >= 1) {
//     clearInterval(interval);
//     return;
//   }
//   // get homepage for userId 123
//   axios.delete(`${CFS_ADDRESS}${BASE_URL_UNFINISHED}/123/8e95801a-85d9-43a3-9997-e59135e40b7c`)
//   .then(response => {
//     // console.log('/unfinished DELETE response:', response.data);
//   })
//   .catch(err => {
//     console.error('/unfinished DELETE error:', err);
//   })
// }, 10*1000);


// set unplayed videos for user 123
var postIterationCount = 0
var interval = setInterval(() => {
  if(postIterationCount++ >= 1) {
    clearInterval(interval);
    return;
  }
  // get homepage for userId 123
  axios.post(`${CFS_ADDRESS}${BASE_URL_UNFINISHED}/123/`, {
    videoIds: unwatchedIds
  })
  .then(response => {
    // console.log('/unfinished POST response:', response.data);
  })
  .catch(err => {
    console.error('/unfinished POST error:', err);
  })
}, 7*1000);


module.exports = router;