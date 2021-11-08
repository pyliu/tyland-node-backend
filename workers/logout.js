
const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const isEmpty = require("lodash/isEmpty");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (authorizationHeader) => {
  const hash = authorizationHeader.replace('Bearer ', '')
  const client = new MongoClient(config.connUri);
  const data = { ok: false, message: '未知的錯誤' };
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const userCollection = client.db().collection(config.userCollection);
    const tokenFilter = { 'token.hash': hash };
    const user = await userCollection.findOne(tokenFilter);
    if (isEmpty(user)) {
      config.isDev && console.log(__basename, '❌ 找不到使用者資料', tokenFilter);
      data.message = `找不到使用者(token: ${hash})`;
    } else {
      config.isDev && console.log(__basename, '✔ 找到使用者資料', tokenFilter);
      const result = await userCollection.updateOne(tokenFilter, { $set: { token: { hash: null, expire: null } } });
      config.isDev && console.log(__basename, `${user._id} token 已清空`, `找到 ${result.matchedCount} 個文件, 更新 ${result.modifiedCount} 個文件`);
      data.ok = true;
      data.message = `${user._id} ${user.name} token 已清空。`;
    }
  } catch (e) {
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(data);
    await client.close();
  }
});
