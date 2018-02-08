var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'elastic:elastic@localhost:9200',
  log: 'info'
});

module.exports = client;