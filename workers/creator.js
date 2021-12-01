const path = require("path");
const { parentPort } = require("worker_threads");
const __basename = path.basename(__filename);
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到搜尋界標資料 BY 上傳者 訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行搜尋界標資料 BY 上傳者 ... ", postBody);
    const caseCollection = client.db().collection(config.caseCollection);
    
    const limit = postBody.limit || 0;
    delete postBody.limit;
    // prepare search criteria
    const criteria = {};
    if (postBody.opdate) {
        criteria["lands.marks.opdate"] = postBody.opdate;
    }
    if (postBody.uploader) {
        criteria["lands.marks.creator"] = postBody.uploader;
    }
    
    const cursor = await caseCollection.find(
      criteria
    ).sort({_id: -1});
    limit && cursor.limit(limit);
    const count = await cursor.count();
    if (count === 0) {
      const message =  "⚠ 找不到資料。";
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = message;
      response.payload = postBody;
    } else {
      // const cases = [];
      // await cursor.forEach((element) => {
      //   cases.push(element);
      // });
      const cases = await cursor.toArray();
      // also send hex object id back 
      cases.forEach(element => {
        element._id = element._id.toString();
      });
      const message = `🟢 找到 ${count} 筆資料`;
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
