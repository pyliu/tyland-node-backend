const { parentPort } = require("worker_threads");
const path = require("path");
const __basename = path.basename(__filename);
const md5 = require("md5");
const isEmpty = require("lodash/isEmpty");
const config = require(path.join(__dirname, "..", "model", "config.js"))
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (loginInfo) => {

  const data = { loggedIn: false, token: 'UNAUTHORIZED' };
  config.isDev && console.log(__basename, '👉 login worker 設定初始回應資料', data);

  const client = new MongoClient(config.connUri);
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const userCollection = client.db().collection(config.userCollection);
    const user = await userCollection.findOne({ _id: loginInfo.userid });
    if (!isEmpty(user)) {
      config.isDev && console.log(__basename, '✔ 找到使用者資料', user);
      if (user && user.pwd === md5(loginInfo.password)) {
        config.isDev && console.log(__basename, '✔ 登入成功');
        data.loggedIn = true;
        data.token = md5(+new Date() + loginInfo.userid);
        const token = {
          hash: data.token,
          expire: +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
        };
        const result = await userCollection.updateOne({ _id: loginInfo.userid }, { $set: { token: token } });
        config.isDev && console.log(__basename, `${loginInfo.userid} 文件已更新`, `找到 ${result.matchedCount} 個文件, 更新 ${result.modifiedCount} 個文件`, token);
      } else {
        config.isDev && console.log(__basename, '❌ 登入失敗(密碼不對)', { _id: loginInfo.userid });
      }
    } else {
      config.isDev && console.log(__basename, '❌ 登入失敗(找不到使用者)', { _id: loginInfo.userid });
    }
  } catch (e) {
    config.isDev && console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(data);
    await client.close();
  }
});
