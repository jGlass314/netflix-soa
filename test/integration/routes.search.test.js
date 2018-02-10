process.env.NODE_ENV = 'test';

const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/index');
const client = require('../../src/database/connection');

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// const redisClient = redis.createClient('redis://hr-netflix-cfs-redis.jml4ht.0001.usw1.cache.amazonaws.com:6379');
const redisClient = redis.createClient('redis://localhost:6379');

const faker = require('faker');

describe('search endpoint services', () => {
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
      })
    });
  
    afterEach(() => {
      chai.request(server)
      .delete('/content/some-vid')
      .end();
    });

    describe('POST /search/:queryString', () => {
      it('should respond okay', done => {
        chai.request(server)
        .post('/search')
        .send({q: 'hello'})
        .end((err, res) => {
          // there should be no errors
          if(err) console.log('error:', err);
          should.not.exist(err);
          // there should be a 200 status code
          res.status.should.equal(200);
          // the response should be JSON
          res.type.should.equal('application/json');
          // the JSON response body should have a
          // key-value pair of {"status": "success"}
          res.body.status.should.eql('success');
          // the JSON response body should have a
          // key-value pair of {"data": 1 movie object}
          // res.body.message.should.eql('posted unfinished videos for user 12');
          done();
        })
      })
    })
  });
});