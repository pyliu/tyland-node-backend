const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (data) => {
  const userId = data.id;
  const postBody = data.post;
  config.isDev && console.log(`收到新增 ${userId} 使用者訊息`, postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    // TODO: ...
    const userCollection = client.db().collection(config.userCollection);
    const result = await userCollection.insertOne(postBody);
    config.isDev && console.log(__basename, "✏ 執行結果", result);
    if (result.acknowledged) {
      let statusCode = config.statusCode.SUCCESS;
      let message =  `✔ 新增使用者 ${userId} 資料成功。`;
      message = `${message} (doc: ${result.insertedId.toString()})`;
      config.isDev && console.log(__basename, message);
      response.statusCode = statusCode;
      response.message = message;
      response.payload = result;
    }
  } catch (e) {
    console.error(__basename, '❗ 處理新增使用者資料執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
