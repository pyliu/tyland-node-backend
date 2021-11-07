const path = require("path");
const { parentPort } = require("worker_threads");
const md5 = require("md5");
const mongoUser = require(path.join(__dirname, "..", "model", "user.js"))

parentPort.on("message", async (loginInfo) => {
  const data = { loggedIn: false, token: 'INVALID' };
  const doc = await mongoUser.find({ _id: loginInfo.userid }).exec();
  console.log(doc)
  if (doc && doc.pwd === md5(loginInfo.password)) {
    data.loggedIn = true;
    data.token = md5(+new Date() + loginInfo.userid);
    const token = {
      hash: data.token,
      expire: +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
    };
    doc.token = token;
    doc.save(function(err) {
      if (err) return console.error(err);
    });
  }
  parentPort.postMessage(data);
});
