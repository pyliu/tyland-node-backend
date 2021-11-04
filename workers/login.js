const path = require("path");
const { parentPort } = require("worker_threads");
const md5 = require("md5");
const userDB = require(path.join(__dirname, "..", "user-db.js"));

parentPort.on("message", (loginInfo) => {
  const token = md5(+new Date() + loginInfo.userid)
  const expireTime = +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
  const db = new userDB();
  // set access token, params keys match the db schema
  db.setUserAccessToken({ id: loginInfo.userid, token: token, token_expiretime: expireTime });
  const hash = db.getUserPw(loginInfo.userid);
  const data = {
    loggedIn: md5(loginInfo.password) === hash,
    clientId: loginInfo.userid,
    token: token,
    tokenExpiretime: expireTime
  };
  parentPort.postMessage(data);
});
