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
    const lastCriteria = {};
    if (postBody.opdate) {
      criteria["lands.marks.opdate"] = postBody.opdate;
      lastCriteria["mark.opdate"] = postBody.opdate;
    }
    if (postBody.uploader) {
      criteria["lands.marks.creator"] = postBody.uploader;
      lastCriteria["mark.creator"] = postBody.uploader;
    }

    config.isDev && console.log(criteria);
    
    const agg = [
      {
        '$match': criteria
      }, {
        '$project': {
          '_id': 0, 
          'mark': '$lands.marks'
        }
      }, {
        '$unwind': {
          'path': '$mark'
        }
      }, {
        '$unwind': {
          'path': '$mark'
        }
      }, {
        '$match': lastCriteria
      }
    ];

    const cursor = await caseCollection.aggregate(agg);
    const docs = await cursor.toArray();

    const marks = [];
    docs.forEach(document => marks.push({ ...document.mark }));
    
    const message = `🟢 找到 ${marks.length} 筆界標資料`;
    config.isDev && console.log(__basename, message);
    response.statusCode = config.statusCode.SUCCESS;
    response.message = message;
    response.payload = marks;

  } catch (e) {
    console.error(__basename, "❗ 處理搜尋執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
