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

const faker = require('faker');

// const base = 'http://localhost:1337';

describe('home endpoint services', () => {
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
        .end((err, res) => {
          // console.log('sending POST /user request');
          chai.request(server)
          .post('/user')
          .send({
            userId: '123',
            subscriptionStatus: 'active',
            region: 'Norway'
          })
          .end((err, res) => {
            chai.request(server)
            .post('/unfinished/123')
            .send({videoIds: ['some-vid']})
            .end();
          });
        })
      })
    });
  
    afterEach(() => {
      chai.request(server)
      .delete('/content/some-vid')
      .end();
    });

    describe('POST /home', () => {
      it('should respond okay', done => {
        var homeListings = {};
        homeListings['drama'] = ['some-vid'];
        homeListings['comedy'] = ['some-vid'];
        homeListings['horror'] = ['some-vid'];
        chai.request(server)
        .post('/home')
        .send({
          homePage: homeListings
        })
        .end((err, res) => {
          // there should be no errors
          if(err) console.log('error:', err);
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
          res.body.message.should.eql('home page posted.');
          done();
        })
      })
    })

    describe('GET /home?userId', () => {
      it('should respond okay', done => {
        chai.request(server)
        .get('/home?userId=123')
        .end((err, res) => {
          // there should be no errors
          if(err) console.log('error:', err);
          should.not.exist(err);
          // there should be a 200 status code
          res.status.should.equal(200);
          // the response should be JSON
          res.type.should.equal('application/json');
          console.log('GET /home?userId=123 res.body', res.body);
          res.body._unfinished[0].videoId.indexOf('some-vid').should.not.equal(-1);
          // the JSON response body should have a
          // key-value pair of {"status": "success"}
          // res.body.status.should.eql('success');
          // the JSON response body should have a
          // key-value pair of {"data": 1 movie object}
          // res.body.message.should.eql('home page posted.');
          done();
        })
      })
    })
  })
})