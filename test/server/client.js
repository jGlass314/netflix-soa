const Router = require('koa-router');
const axios = require('axios');
const qs = require('qs');
const faker = require('faker');

const router = new Router();
const BASE_URL_CONTENT = `/content`;
const BASE_URL_HOME = `/home`;
const BASE_URL_SEARCH = `/search`;
const CFS_ADDRESS = 'http://localhost:3000';

// GET HOME PAGE
var homeIterationCount = 0
var homeInterval = setInterval(() => {
  if(homeIterationCount++ >= 2) {
    clearInterval(homeInterval);
    return;
  }
  // get homepage for userId 123
  axios.get(`${CFS_ADDRESS}${BASE_URL_HOME}?userId=123`)
  .then(response => {
    
    console.log('/home GET response:', response.data);
  })
  .catch(err => {
    console.error('/home GET error:', err);
  })
}, 4*1000);

// SEARCH
var searchIterationCount = 0;
var searchInterval = setInterval(() => {
  if(searchIterationCount++ >= 1) {
    clearInterval(searchInterval);
    return;
  }
  // var searchWords = faker.random.word();
  var searchWords = 'that';
  // var searchWords = 'Back';
  console.log('searchWords:', searchWords);
  axios.post(`${CFS_ADDRESS}${BASE_URL_SEARCH}`, {
    q: searchWords
  })
  .then(response => {
    console.log('/search POST response:', response.data);
  })
  .catch(err => {
    console.log('/search POST error:', err);
  })
}, 5000);

module.exports = router;