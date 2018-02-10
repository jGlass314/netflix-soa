process.env.NODE_ENV = 'test';

const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/index');
const es = require('../../src/database/connection');
const client = require('../../src/database/connection');

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// const redisClient = redis.createClient('redis://hr-netflix-cfs-redis.jml4ht.0001.usw1.cache.amazonaws.com:6379');
const redisClient = redis.createClient('redis://localhost:6379');

const faker = require('faker');

const base = 'http://localhost:1337';

describe('user endpoint services', () => {
  describe('when not stubbed', () => {
    describe('POST /user', () => {
      it('should respond okay', done => {
        var subInfo = {};
        subInfo.userId = 1;
        subInfo.subscriptionStatus = 'active';
        subInfo.region = 'USA';
        chai.request(server)
        .post('/user')
        .send(subInfo)
        .end((err, res) => {
          // there should be no errors
          // console.log('error:', err);
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
          res.body.message.should.eql('sub info for user 1 posted');

          redisClient.hgetallAsync('user:1')
            .then(result => {
              // console.log('user test result:', result);
              result.subscriptionStatus.should.eql('active');
              result.region.should.equal('USA');
              done();
            })
            .catch(err => {
              console.error('user test error:', err);
              done();
            })
        })
      })
    })
  })
})