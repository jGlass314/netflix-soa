var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});

var faker = require('faker');
var randomWords = require('random-words');
// faker.seed(123);

let makeFakeSnippets = recordCount => {
  let snippets = [];
  for(let i = 0; i < recordCount; i++) {
    let videoId = faker.random.uuid();
    let title = randomWords({ min: 1, max: 3, join: ' ' });
    let regions = [];
    for(let j = 0; j < Math.random() * 20 + 1; j++) {
      let country = faker.address.country();
      while(regions.includes(country)) {
        country = faker.address.country();
      } 
      regions.push(faker.address.country());
    }
    let genres = [];
    for(let j = 0; j < Math.random() * 5 + 1; j++) {
      let genre = randomWords({ min: 1, max: 1})[0];
      while(genres.includes(genre)) {
        genre = randomWords({ min: 1, max: 1});
      }
      genres.push(genre);
    }
    let director = faker.name.firstName() + ' ' + faker.name.lastName();
    let cast = [];
    for(let j = 0; j < Math.random() * 5 + 1; j++) {
      let member = faker.name.firstName() + ' ' + faker.name.lastName();
      while(cast.includes(member)) {
        member = faker.name.firstName() + ' ' + faker.name.lastName();
      }
      cast.push(member);
    }
    let thumbnailURL = faker.image.imageUrl();
    let trailerURL = faker.image.imageUrl();
    snippets.push({
      videoId: videoId,
      title: title,
      regions: regions,
      genres: genres,
      director: director,
      cast: cast,
      thumbnailURL: thumbnailURL,
      trailerURL: trailerURL
    });
  }
  return snippets;
};
// let snippets = makeFakeSnippets(5);
// console.log(snippets);
var index = 0;
const indexSnippets = async (recordCount) => {
  // for(var i = 0; index < recordCount; i++) {
    let snippets = makeFakeSnippets(recordCount);
    var body = [];
    for(var j = 0; j < snippets.length; j++) {
      body.push({index: { _index: 'netflix_dev', _type: 'snippet', _id: snippets[j].videoId}});
      body.push(snippets[j]);
    }
    client.bulk({
      body: body
    })
    .catch(err => {
      console.log(err);
    })
}

var intervalCount = 0;
var interval = setInterval(() => {
  if(intervalCount++ === 100) {
    clearInterval(interval);
  } else {
    console.log('count:', intervalCount);
    indexSnippets(100000);
  }
}, 10*1000);


module.exports = makeFakeSnippets;

