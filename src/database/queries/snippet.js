const client = require('../connection');

const getAllSnippets = () => {
  return client.search({
    index: 'netflix_dev',
    body: {
      query: {
        'match_all' : {}
      }
    }
  })
  .catch(err => {
    console.error(err);
  })
}

const getSnippet = (vid) => {
  return client.get({
    index: 'netflix_dev',
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
    index: 'netflix_dev',
    type: 'snippet',
    body: {
      ids: docs
    },
    _source: true
  });
}

const addSnippet = (snippet) => {
  return client.index({
    index: 'netflix_dev',
    type: 'snippet',
    id: snippet.id,
    body: snippet,
    refresh: 'true'
  });
}

const updateSnippet = (video) => {
  return client.update({
    index: 'netflix_dev',
    type: 'snippet',
    id: video.id,
    body: {
      doc: {
        regions: video.regions
      }
    }
  })
}

const deleteSnippet = (videoId) => {
  return client.delete({
    index: 'netflix_dev',
    type: 'snippet',
    id: videoId,
    refresh: 'true'
  })
}

const searchSnippet = (queryString) => {
  return client.search({
    index: 'netflix_dev',
    // defaultOperator: 'AND',
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
  getAllSnippets,
  getSnippet,
  multiGetSnippet,
  addSnippet,
  updateSnippet,
  deleteSnippet,
  searchSnippet
};