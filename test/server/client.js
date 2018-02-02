const Router = require('koa-router');
const axios = require('axios');
const faker = require('faker');

const router = new Router();
const BASE_URL_CONTENT = `/content`;
const BASE_URL_HOME = `/home`;
const BASE_URL_SEARCH = `/search`;
const CFS_ADDRESS = 'http://localhost:3000';

// GET HOME PAGE
// var iterationCount = 0
// var interval = setInterval(() => {
//   if(iterationCount++ === 1000) {
//     clearInterval(interval);
//   }
//   // get homepage for userId 123
//   axios.get(`${CFS_ADDRESS}${BASE_URL_HOME}/123`)
//   .then(response => {
//     console.log('/home GET response:', response.data.message);
//   })
//   .catch(err => {
//     console.error('/home GET error:', err);
//   })
// }, 5);

// SEARCH
var iterationCount = 0;
var interval = setInterval(() => {
  if(iterationCount++ === 1) {
    clearInterval(interval);
    return;
  }
  var searchWords = faker.random.word();
  // var searchWords = 'Back';
  console.log('searchWords:', searchWords);
  axios.post(`${CFS_ADDRESS}${BASE_URL_SEARCH}`, {
    q: searchWords
  })
  .then(response => {
    console.log('/search GET response:', response.data);
  })
  .catch(err => {
    console.log('/search GET error:', err);
  })
}, 5);

module.exports = router;