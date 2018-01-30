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

module.exports = {
  getAllSnippets,
  addSnippet,
  updateSnippet,
  deleteSnippet
};