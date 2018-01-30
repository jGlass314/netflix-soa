const imdb = require('imdb-api');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});
const API_KEY = 'aaf6af6';

var faker = require('faker');
// faker.seed(234);

var arr = [];

var addMovies = count => {
  for(var i = 0; i < count; i++) {
  // queries.push(imdb.get(faker.random.word().concat('*'), {apiKey: API_KEY, timeout: 30000}));
  imdb.get('*'.concat(faker.random.word()).concat('*'), {apiKey: API_KEY, timeout: 30000})
    // .then(val => val)
    .then((val) => {
      arr.push(val);
      console.log(arr.length, val);
      client.index({
        index: 'netflix_dev',
        type: 'snippet',
        body: {
          videoId: faker.random.uuid(),
          title: val.title,
          regions: val.country.split(','),
          genres: val.genres.split(','),
          director: val.director,
          cast: val.actors.split(','),
          thumbnailURL: val.poster,
          trailerURL: val.poster
        }
      })
    })
    .catch(err => console.log('there was an error:', err));
  }
}

var timesRun = 0;
var interval = setInterval(() => {
  timesRun++;
  if(timesRun === 30) {
    clearInterval(interval);
  }
  addMovies(10);
}, 40 * 1000)