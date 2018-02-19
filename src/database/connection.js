var elasticsearch = require('elasticsearch');
require('dotenv').config()
var client = new elasticsearch.Client({
  host: process.env.ES_URL,
  log: 'info'
});

module.exports = client;