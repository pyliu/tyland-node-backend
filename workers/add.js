const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log('收到新增案件訊息', postBody);
  // auth token, e.g. "1dca1747faea2a040d8adedba4cb44ec"
  const hash = postBody.token;
  const client = new MongoClient(config.connUri);
  let response = {
    ok: false,
    message: '認證失敗'
  }
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const userCollection = client.db().collection(config.userCollection);
    const tokenFilter = { 'token.hash': hash };
    const user = await userCollection.findOne(tokenFilter);
    if (isEmpty(user)) {
      config.isDev && console.log(__basename, '❌ 找不到使用者資料', tokenFilter);
    } else {
      config.isDev && console.log(__basename, '🔎 檢查 token 是否已過期', hash);
      const expire = user.token.expire
      const now = +new Date();
      if (now > expire) {
        config.isDev && console.log(__basename, '❌ token 已過期，需重新登入!', hash);
        response.ok = false;
        response.message = '認證已過期，請重新登入系統!';
      } else {
        config.isDev && console.log(__basename, '👌 已通過認證，繼續執行新增案件 ... ');
        // authenticated
        response.ok = true
        response.message = '待完成實作 ... '
      }
    }
  } catch (e) {
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
