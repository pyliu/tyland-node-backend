const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到搜尋案件訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行搜尋案件 ... ", postBody);
    const caseCollection = client.db().collection(config.caseCollection);
    
    const limit = postBody.limit || 0;
    delete postBody.limit;
    
    const cursor = await caseCollection.find(postBody).sort({_id: -1});
    limit && cursor.limit(limit);
    const count = await cursor.count();
    if (count === 0) {
      const message =  "❔ 找不到資料。";
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = message;
      response.payload = postBody;
    } else {
      const cases = [];
      await cursor.forEach((element) => {
        cases.push(element);
      });
      const message = `🟢 找到 ${count} 案件`;
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.SUCCESS;
      response.message = message;
      response.payload = cases;
    }
  } catch (e) {
    console.error(__basename, "❗ 處理搜尋執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
