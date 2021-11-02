const isEmpty = require('lodash/isEmpty')

const trim = (x) => { return typeof x === 'string' ? x.replace(/^[\s\r\n]+|[\s\r\n]+$/gm, '') : '' }

const timestamp = function (date = 'time') {
  const now = new Date()
  const full = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2)
  if (date === 'full') {
    // e.g. 2021-03-14 16:03:00
    return full
  } else if (date === 'date') {
    return full.split(' ')[0]
  } else {
    // e.g. 16:03:00
    return full.split(' ')[1]
  }
}

const sleep = function (ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}

module.exports.timestamp = timestamp
module.exports.trim = trim
module.exports.sleep = sleep
module.exports.isEmpty = isEmpty
