var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info'
});

var faker = require('faker');
// faker.seed(123);

// client.search({
//   q: 'search'
// }).then(function (body) {
//   var hits = body.hits.hits;
//   console.log('hits:', hits);
// }, function (error) {
//   console.trace(error.message);
// });

let makeFakeSnippets = recordCount => {
  let snippets = [];
  for(let i = 0; i < recordCount; i++) {
    let videoId = faker.random.uuid();
    let title = faker.random.words();
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
      let genre = faker.random.words();
      while(genres.includes(genre)) {
        genre = faker.random.words();
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
      id: videoId,
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
      body.push({index: { _index: 'netflix_dev', _type: 'snippet', _id: snippets[j].id}});
      body.push(snippets[j]);
    }
    client.bulk({
      body: body
    })
    .catch(err => {
      console.log(err);
    })
  // }
  // client.index({
  //   index: 'netflix_dev',
  //   type: 'snippet',
  //   body: {
  //     videoId: '1234',
  //     title: '',
  //     regions: [''],
  //     genres: [''],
  //     director: '',
  //     cast: ['']
  //   }
  // })
}

var intervalCount = 5;
var interval = setInterval(() => {
  if(intervalCount++ === 100) {
    clearInterval(interval);
  } else {
    console.log('count:', intervalCount);
    indexSnippets(100000);
  }
}, 10*1000);


module.exports = makeFakeSnippets;

