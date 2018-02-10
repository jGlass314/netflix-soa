const Router = require('koa-router');
const axios = require('axios');
const faker = require('faker');

const router = new Router();
const BASE_URL_UNFINISHED = `/unfinished`;
const CFS_ADDRESS = 'http://localhost:3000';

const unwatchedIds = [
  // "a4863478-f69f-42b9-97bb-83ea7bd7261a",
  "b0f7ebad-59db-4ec2-b769-1cf47fd6ba6c",
  "8e95801a-85d9-43a3-9997-e59135e40b7c",
  "1086a333-93bc-47ea-87be-408158be26f6",
  "6e0855cf-fdff-4455-a2c1-4ad65d1d48f9",
  "963c63d8-6d43-4b2c-a1a3-faa52bfca924",
  "f2cb4ecb-bae4-4c42-987d-79bfa08fda66"
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