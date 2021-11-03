const path = require("path");
const { parentPort } = require("worker_threads");
const md5 = require("md5");
const userDB = require(path.join(__dirname, "..", "user-db.js"));

parentPort.on("message", (loginInfo) => {
  const token = md5(+new Date() + loginInfo.username)
  const expireTime = +new Date() + 30 * 1000 //Date.now() milliseconds 微秒數
  const db = new userDB();
  // set access token, params keys match the db schema
  db.setUserAccessToken({ id: loginInfo.username, token: token, token_expiretime: expireTime });
  const hash = db.getUserPw(loginInfo.username);
  const data = {
    loggedIn: md5(loginInfo.password) === hash,
    clientId: loginInfo.username,
    token: token,
    tokenExpiretime: expireTime
  };
  parentPort.postMessage(data);
});
