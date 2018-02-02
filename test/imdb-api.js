const imdb = require('imdb-api');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});
const API_KEY = 'aaf6af6';

var faker = require('faker');
// faker.seed(234);



var addMovies = count => {
  var arr = [];
  var promises = [];
  for(var i = 0; i < count; i++) {
    // console.log('arr.length:', arr.length, 'count:', count);
    var randomWords = faker.random.word().split(' ');
    var randomWord = randomWords[Math.floor(Math.random()*randomWords.length)%randomWords.length];
    promises.push(imdb.get('*'.concat(randomWord).concat('*'), {apiKey: API_KEY, timeout: 30000}));
  }
  Promise.all(promises)
    .then(results => {
      console.log('result count:', results.length);
      results.forEach(result => {
        var id = faker.random.uuid();
        arr.push({index: { _index: 'netflix_dev', _type: 'snippet', _id: id}})
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
        console.log(arr.length, arr[arr.length-1]);
      })
    })
    .then(() => {
      client.bulk({
        body: arr
      });
    })
    .catch(err => console.log('there was an error:', err));
}

var timesRun = 0;
var interval = setInterval(() => {
  timesRun++;
  if(timesRun === 1000) {
    clearInterval(interval);
  }
  addMovies(10);
}, 1000)

// addMovies(10);