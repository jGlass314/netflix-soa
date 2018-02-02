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

const faker = require('faker');

const base = 'http://localhost:1337';

describe('home endpoint services', () => {
  describe('when not stubbed', () => {
    describe('POST /home', () => {
      it('should respond okay', done => {
        var homeListings = {};
        homeListings['drama'] = ['vid1', 'vid2', 'vid3'];
        homeListings['comedy'] = ['vid4', 'vid5', 'vid6'];
        homeListings['horror'] = ['vid7', 'vid8', 'vid9'];
        chai.request(server)
        .post('/home')
        .send({
          homePage: homeListings
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
          res.body.message.should.eql('home page posted.');
          done();
        })
      })
    })
  })
})