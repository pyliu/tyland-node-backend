const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require('lodash/isEmpty')
const config = require(path.join(__dirname, "config"));
const MongoClient = require("mongodb").MongoClient;

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

const timestampToDate = function (ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' +
    ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
    ('0' + d.getDate()).slice(-2) + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' +
    ('0' + d.getMinutes()).slice(-2) + ':' +
    ('0' + d.getSeconds()).slice(-2)
}

const sleep = function (ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}

const authenticate = async function (authHeader) {
  if (isEmpty(authHeader) || !authHeader.startsWith("Bearer ")) {
    console.warn('⚠ 找不到 Authorization 表頭', authHeader);
    return false;
  }
  const hash = authHeader.replace("Bearer ", "");
  const client = new MongoClient(config.connUri);
  try {
    await client.connect();
    config.isDev && console.log(__basename, "✔ DB已連線");
    const userCollection = client.db().collection(config.userCollection);
    const tokenFilter = { "token.hash": hash };
    const user = await userCollection.findOne(tokenFilter);
    if (isEmpty(user)) {
      return false;
    } else {
      const authority = parseInt(user.authority) || 0;
      if ((authority & 2) === 2) {
        data.message = '⚠ 帳戶已停用';
        config.isDev && console.log(__basename, "🔴 ⚠ 帳戶已停用!", user.id, user.name);
        return false;
      }
      config.isDev && console.log(__basename, "🔎 檢查 token 是否已過期", hash);
      const expire = user.token.expire;
      config.isDev && console.log(__basename, "❗ token 預計過期時間", timestampToDate(expire));
      const now = +new Date();
      if (now > expire) {
        config.isDev && console.log(__basename, "🔴 token 已過期，需重新登入!", hash);
        return false
      }
      config.isDev && console.log(__basename, `🟢 ${user.id} token(${hash}) 正常`);
      return true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
  return false;
}

module.exports.timestamp = timestamp
module.exports.timestampToDate = timestampToDate
module.exports.trim = trim
module.exports.sleep = sleep
module.exports.isEmpty = isEmpty
module.exports.authenticate = authenticate
