const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到搜尋使用者訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const userCollection = client.db().collection(config.userCollection);
    
    
    const limit = postBody.limit || 0;
    delete postBody.limit;
    
    const cursor = await userCollection.find(postBody).sort({_id: -1});
    limit && cursor.limit(limit);
    const count = await cursor.count();
    if (count === 0) {
      const message =  "❔ 找不到使用者資料。";
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = message;
      response.payload = postBody;
    } else {
      // const cases = [];
      // await cursor.forEach((element) => {
      //   cases.push(element);
      // });
      const users = await cursor.toArray();
      users.forEach((user) => {
        // replace _id with hex string
        user._id = user._id.toString();
      });
      const message = `🟢 找到 ${count} 個使用者`;
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.SUCCESS;
      response.message = message;
      response.payload = users;
    }
  } catch (e) {
    console.error(__basename, '❗ 處理搜尋使用者執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
