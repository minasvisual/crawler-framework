const fs = require("fs")

exports.log = (data, json) => fs.appendFile('./log.txt', JSON.stringify({message: data, 'data':json, timestamp: new Date().toISOString() }) + '\r', function (err) {
    if (err) throw err;
  })