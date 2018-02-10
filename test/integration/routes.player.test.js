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
const redisClient = redis.createClient('redis://localhost:6379');

const client = require('../../src/database/connection');

const faker = require('faker');

const base = 'http://localhost:1337';

describe('player endpoint services', () => {
  describe('when not stubbed', () => {
    
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
    
    describe('POST /unfinished/:userId', () => {
      it('should respond okay', done => {
        var homeListings = {};
        videoIds = ['some-vid'];
        chai.request(server)
        .post('/unfinished/12')
        .send({
          videoIds: videoIds
        })
        .end((err, res) => {
          // there should be no errors
          console.log('error:', err);
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
          res.body.message.should.eql('posted unfinished videos for user 12');
          done();
        })
      })
    })
    describe('DELETE /unfinished/:userId/:videoId', () => {
      it('should respond okay', done => {
        var homeListings = {};
        chai.request(server)
        .delete('/unfinished/12/some-vid')
        .end((err, res) => {
          // there should be no errors
          // console.log('error:', err);
          should.not.exist(err);
          // there should be a 20 status code
          // (indicating that something was "deleted")
          res.status.should.equal(200);
          // the response should be JSON
          res.type.should.equal('application/json');
          // the JSON response body should have a
          // key-value pair of {"status": "success"}
          res.body.status.should.eql('success');
          // the JSON response body should have a
          // key-value pair of {"data": 1 movie object}
          res.body.message.should.eql('deleted unfinished video some-vid for user 12');
          done();
        })
      })
    })
  })
})

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