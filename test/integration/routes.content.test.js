process.env.NODE_ENV = 'test';

const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/index');

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// const redisClient = redis.createClient('redis://hr-netflix-cfs-redis.jml4ht.0001.usw1.cache.amazonaws.com:6379');
const redisClient = redis.createClient('redis://localhost:6379');

const client = require('../../src/database/connection');

const faker = require('faker');

const base = 'http://localhost:1337';

describe('content endpoint service', () => {
  beforeEach(() => {
    // flush redis cache
    redisClient.flushdbAsync()
    .then(() => {
      chai.request(server)
      .post('/content')
      .send({
        videoId: 'some-vid',
        title: 'hello',
        regions: ['Norway'],
        genres: ['horror'],
        director: 'some director',
        cast: ['cast member'],
        thumbnailURL: faker.image.imageUrl(),
        trailerURL: faker.image.imageUrl()
      })
      .end()
    })
  });

  afterEach(() => {
    chai.request(server)
    .delete('/content/some-vid')
    .end();
  });

  describe('GET /content', () => {
    it('should return full content', (done) => {
      chai.request(server)
      .get('/content/some-vid')
      .end((err, res) => {
        // there should be no errors
        should.not.exist(err);
        // there should be a 200 status code
        res.status.should.equal(200);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        res.body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": [3 movie objects]}
        console.log('res.body.data.data:', res.body.data.data);
        res.body.data.data.cast.length.should.be.equal(3);
        // the first object in the data array should
        // have the right keys
        res.body.data.data.should.include.keys(
          'videoId', 'title', 'regions', 'genres', 'director', 'cast'
        );
        done();
      });
    });
  });
  
  describe('POST /content', () => {
    it('should create an entry', (done) => {
      // send post request
      chai.request(server)
      .post('/content')
      .send(makeFakeSnippet(1, ['some-vid'])[0])
      .end((err, res) => {
        // there should be no errors
        should.not.exist(err);
        // there should be a 201 status code
        // (indicating that something was "created")
        res.status.should.equal(201);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        res.body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": 1 movie object}
        res.body.data.result.should.satisfy(value => {return (value === 'updated' || value === 'created')});
        done();
      });
    });
  });
  
  describe('PATCH /content', () => {
    it('should update an entry', (done) => {
      console.log('calling content PATCH test');
      let regions = [];
      for(let j = 0; j < Math.random() * 20 + 1; j++) {
        let country = faker.address.country();
        while(regions.includes(country)) {
          country = faker.address.country();
        } 
        regions.push(faker.address.country());
      }
  
      chai.request(server)
      .patch('/content')
      .send(
        {
          videoId: 'some-vid',
          regions: regions
        }
      )
      .end((err, res) => {
        // there should be no errors
        if(err) console.error(err);
        should.not.exist(err);
        // there should be a 202 status code
        // (indicating that something was "created")
        res.status.should.equal(202);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        res.body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": 1 movie object}
        res.body.data.result.should.satisfy(value => {return (value === 'updated' || value === 'noop')});
        done();
      });
    });
  });
  
  describe('DELETE /content/:videoId', () => {
    it('should delete the movie', (done) => {
      client.count({index: 'netflix_dev'})
      .then((count) => {
        chai.request(server)
        .delete('/content/some-vid')
        .end((err, res) => {
          // there should be no errors
          should.not.exist(err);
          // there should be a 200 status code
          res.status.should.equal(200);
          // the response should be JSON
          res.type.should.equal('application/json');
          // the JSON response body should have a
          // key-value pair of {"status": "success"}
          res.body.status.should.eql('success');
          // ensure the movie was in fact deleted
          client.count({index: 'netflix_dev'})
          .then((newCount) => {
            newCount.count.should.eql(count.count - 1);
            done();
          })
          .catch(err => {
            console.error(err);
            done()
          });
        });
      });
    });
    it('should throw an error if the movie does not exist', (done) => {
      chai.request(server)
      .delete('/content/56483287-b696-47b4-9514-a6168e771f4f')
      .end((err, res) => {
        // there should an error
        should.exist(err);
        // there should be a 404 status code
        res.status.should.equal(404);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "error"}
        res.body.status.should.eql('error');
        // the JSON response body should have a
        // key-value pair of {"message": "That movie does not exist."}
        res.body.message.should.eql('That video does not exist.');
        done();
      });
    });
  });
})

const makeFakeContent = (number, videoId) => {
  var videos = [];
  for(var i = 0; i < number; i++) {
    videos.push({
      videoId: videoId,
      description: faker.random.words(30),
      genre: [faker.random.word(), faker.random.word(), faker.random.word()],
      title: faker.random.words(),
      thumbnailURL: faker.image.imageUrl(),
      trailerURL: faker.image.imageUrl(),
      cast: [
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName()
      ],
      director: faker.name.firstName() + ' ' + faker.name.lastName(),
      duration: Math.floor(Math.random() * 3*60*60),
      rating: ['G','PG','PG-13','R'][Math.floor(Math.random() * 4)%4],
      releaseDate: faker.date.past(),
      locationURI: faker.internet.url(),
      isOriginal: Boolean(Math.floor(Math.random() * 2)),
      isMovie: Boolean(Math.floor(Math.random() * 2)),
      regions: [faker.address.country(),faker.address.country(),faker.address.country()]
    });
  }
  return videos;
}

const makeFakeSnippet = (number, videoIds) => {
  var snippets = [];
  for(var i = 0; i < number; i++) {
    console.log('making fake snippet with videoIds[', i, ']:', videoIds[i]);
    snippets.push({
      videoId: videoIds[i],
      genres: [faker.random.word(), faker.random.word(), faker.random.word()],
      title: faker.random.words(),
      thumbnailURL: faker.image.imageUrl(),
      trailerURL: faker.image.imageUrl(),
      cast: [
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName()
      ],
      director: faker.name.firstName() + ' ' + faker.name.lastName(),
      regions: [faker.address.country(),faker.address.country(),faker.address.country()]
    });
  }
  return snippets;
}