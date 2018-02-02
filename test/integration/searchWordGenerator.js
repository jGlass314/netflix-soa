var randomWords = require('random-words');
var fs = require('fs');

fs.open('./keywords.csv', 'w+', (err, fd) => {
  if(err) {
    console.error('error opening file:', err);
  } else {
    for(var i = 0; i < 10000; i++) {
      fs.write(fd, randomWords({ min: 1, max: 3, join: ' ' }) + '\n', (err, written, string) => {
        if(err) {
          console.error('error writing to file:', string);
        } else {
          console.log(string);
        }
      })
    }
  }
})