process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/index');
const es = require('../../src/database/connection');

const client = require('../../src/database/connection');

const faker = require('faker');
// const fakeSnippet = require('../addFakeData');

xdescribe('GET /content', () => {
  it('should return all snippets', (done) => {
    chai.request(server)
    .get('/content')
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
      // console.log('res.body.data.hits.hits', res.body.data.hits.hits);
      res.body.data.hits.hits.length.should.be.above(3);
      // the first object in the data array should
      // have the right keys
      res.body.data.hits.hits[0]._source.should.include.keys(
        'videoId', 'title', 'regions', 'genres', 'director', 'cast'
      );
      done();
    });
  });
});

describe('POST /content', () => {
  it('should create an entry', (done) => {
    // create fake entry
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

    // send post request
    chai.request(server)
    .post('/content')
    .send(
      {
        id: '56483287-b696-47b4-9514-a6168e771f4f',
        title: title,
        regions: regions,
        genres: genres,
        director: director,
        cast: cast,
        thumbnailURL: thumbnailURL,
        trailerURL: trailerURL
      }
    )
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
      res.body.data.result.should.satisfy(value => {return (value === 'updated' || value === 'noop')});
      done();
    });
  });
});

describe('PATCH /content', () => {
  it('should update an entry', (done) => {

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
        id: '56483287-b696-47b4-9514-a6168e771f4f',
        regions: regions
      }
    )
    .end((err, res) => {
      // there should be no errors
      should.not.exist(err);
      // there should be a 201 status code
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

///////////////
describe('DELETE /content/:videoId', () => {
  it('should delete the movie', (done) => {
    console.log('step1');
    client.count({index: 'netflix_dev'})
    .then((count) => {
      console.log('step2, count:', count.count);
      chai.request(server)
      .delete('/content/56483287-b696-47b4-9514-a6168e771f4f')
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
          console.log('step3, newCount:', newCount);
          newCount.count.should.eql(count.count - 1);
          done();
        })
        .catch(err => console.error(err));
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