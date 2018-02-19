const fs = require('fs');
const es = require('event-stream');

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'https://search-hr-netflix-cfs-escluster-ydajj5jy4sugd5oiymyf6wwybm.us-west-1.es.amazonaws.com',
  log: 'info'
});
// const path = '/Users/josklein/Downloads/Database_Files/insert2';
// const path = './sampledata.txt';

var batchSize = 25000;
var snippets = [];

const stream = fs.createReadStream(process.argv[2], 'utf8')
  .pipe(es.split())
  .pipe(es.mapSync(line => {
    stream.pause();
    processLine(line);
    stream.resume();
  })
  .on('error', err => console.error('error while reading file:', err))
  .on('end', () => console.log('read entire file'))
);

const processLine = line => {
  if(line === '') {
    return;
  }
  var entryArray = line.split("|");
  entryArray = entryArray.filter(val => val);
  for(var i = 0; i < entryArray.length; i++) {
      if(entryArray[i].includes(',')) {
        entryArray[i] = entryArray[i].replace(/[\{\}\']/g, '').split(',');
      }
  }
  // console.log('entryArray:', entryArray);
  snippets.push({index: { _index: 'netflix', _type: 'snippet', _id: entryArray[0]}});
  snippets.push({
    videoId: entryArray[0],
    title: entryArray[13],
    regions: entryArray[10],
    genres: entryArray[5],
    director: entryArray[3],
    cast: entryArray[1],
    thumbnailURL: entryArray[12],
    trailerURL: entryArray[14]
  });
}

var interval = setInterval(() => {
  // console.log('interval set');
  if(snippets.length === 0) {
    console.log(process.argv[2], 'size remaining:', snippets.length/2);
    clearInterval(interval);
  } else {
    console.log('size remaining:', snippets.length/2);
    client.bulk({
      body: snippets.splice(0, batchSize*2)
    })
    .catch(err => {
      console.log('bulk load error:', err);
    })
  }
}, 15*1000)

