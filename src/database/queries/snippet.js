const client = require('../connection');
require('dotenv').config()

const getSnippet = (vid) => {
  return client.get({
    index: process.env.ES_INDEX,
    type: 'snippet',
    id: vid
  });
}

const multiGetSnippet = (vids) => {
  let docs = []
  vids.forEach(vid => {
    docs.push(vid)
  });
  return client.mget({
    index: process.env.ES_INDEX,
    type: 'snippet',
    body: {
      ids: docs
    },
    _source: true
  });
}

const addSnippet = (snippet) => {
  return client.index({
    index: process.env.ES_INDEX,
    type: 'snippet',
    id: snippet.videoId,
    body: snippet,
    refresh: 'true'
  });
}

const updateSnippet = (video) => {
  return client.update({
    index: process.env.ES_INDEX,
    type: 'snippet',
    id: video.videoId,
    body: {
      doc: {
        regions: video.regions
      }
    }
  })
}

const deleteSnippet = (videoId) => {
  return client.delete({
    index: process.env.ES_INDEX,
    type: 'snippet',
    id: videoId,
    refresh: 'true'
  })
}

const searchSnippet = (queryString) => {
  return client.search({
    index: process.env.ES_INDEX,
    body: {
      query: {
        "multi_match" : {
          "query": queryString,
          "fields": ["title", "genres", "director", "cast"]
        }
      }
    }
  })
}

module.exports = {
  getSnippet,
  multiGetSnippet,
  addSnippet,
  updateSnippet,
  deleteSnippet,
  searchSnippet
};