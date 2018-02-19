const imdb = require('imdb-api');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  // host: 'localhost:9200',
  host: 'https://search-hr-netflix-cfs-escluster-ydajj5jy4sugd5oiymyf6wwybm.us-west-1.es.amazonaws.com',
  log: 'info'
});
// const API_KEY = 'aaf6af6';
const API_KEY = 'e7a265d3';

var faker = require('faker');
var randomWords = require('random-words');
// faker.seed(234);

var arr = [];
var time = Date.now();
var addMovies = async count => {
  
  for(var i = 0; i < count; i++) {
    const randomWord = randomWords({ min: 1, max: 1 })[0];
    // console.log(randomWord);
    const result = await imdb.get('*'.concat(randomWord).concat('*'), {apiKey: API_KEY, timeout: 30000});
    // console.log(result);
    // console.log('*****arr.length:', arr.length);
    var id = faker.random.uuid();
    arr.push({index: { _index: 'netflix_dev', _type: 'snippet', _id: id}});
    arr.push({
      videoId: id,
      title: result.title,
      regions: result.country.split(','),
      genres: result.genres.split(','),
      director: result.director,
      cast: result.actors.split(','),
      thumbnailURL: result.poster,
      trailerURL: result.poster
    });
    // console.log('*****arr.length:', arr.length);
    if(arr.length % 1000 === 0) {
      console.log('bulk load');
      console.log('average time/request:', (Date.now() - time)/500);
      client.bulk({
        body: arr
      });
      arr = [];
      time = Date.now();
    }
  }
}

var timesRun = 0;
var interval = setInterval(() => {
  timesRun++;
  if(timesRun === 20000) {
    clearInterval(interval);
  }
  console.log('timesRun:', timesRun);
  addMovies(200000);
}, 5*1000)
