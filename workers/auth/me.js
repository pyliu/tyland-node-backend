const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..",  "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (authorizationHeader) => {
  // auth header, e.g. "Bearer 1dca1747faea2a040d8adedba4cb44ec"
  const hash = authorizationHeader.replace("Bearer ", "");
  const client = new MongoClient(config.connUri);
  let userDoc = {}
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const userCollection = client.db().collection(config.userCollection);
    const tokenFilter = { 'token.hash': hash };
    const user = await userCollection.findOne(tokenFilter);
    if (isEmpty(user)) {
      config.isDev && console.log(__basename, '❌ 找不到使用者資料', tokenFilter);
    } else {
      const authority = parseInt(user.authority) || 0;
      if ((authority & 2) === 2) {
        config.isDev && console.log(__basename, "⚠ 帳戶已停用!", user.id, user.name);
      } else {
        config.isDev && console.log(__basename, '✔ 找到使用者資料', tokenFilter);
        userDoc = { ...user };
      }
    }
  } catch (e) {
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(userDoc);
    await client.close();
  }
});
