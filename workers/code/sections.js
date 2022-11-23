const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到取得段小段資訊訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行取得段小段資訊 ... ");
    const codeCollection = client.db().collection(config.codeCollection);
    
    const limit = postBody.limit || 0;
    delete postBody.limit;

    config.isDev && console.log(__basename, `limit: ${limit} site: ${postBody.site_code}`);

    const agg = [
      {
        '$match': {
          'site': postBody.site_code
        }
      }, {
        '$project': {
          '_id': 0, 
          'sections': '$sections'
        }
      }, {
        '$unwind': {
          'path': '$sections'
        }
      }
    ];

    const cursor = await codeCollection.aggregate(agg);

    // const cursor = await codeCollection.find(postBody).sort({_id: -1});
    limit && cursor?.limit(limit);
    const sections = await cursor.toArray();
    const count = sections.length;
    // const count = cursor.count();
    if (count === 0) {
      const message =  "⚠ 找不到段小段資料。";
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = message;
      response.payload = postBody;
    } else {
      const message = `🟢 ${postBody.site_code} 找到 ${count} 筆段小段資料`;
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.SUCCESS;
      response.message = message;
      /**
       * extract value object from sections attr
       */
      response.payload = sections.map(code => code.sections);
    }
  } catch (e) {
    console.error(__basename, "❗ 處理取得段小段資訊執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
