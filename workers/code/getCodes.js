const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到取得收件字資訊訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行取得收件字資訊 ... ");
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
          'codes': '$codes'
        }
      }, {
        '$unwind': {
          'path': '$codes'
        }
      }
    ];

    const cursor = await codeCollection.aggregate(agg);

    // const cursor = await codeCollection.find(postBody).sort({_id: -1});
    limit && cursor?.limit(limit);
    const codes = await cursor.toArray();
    const count = codes.length;
    // const count = cursor.count();
    if (count === 0) {
      const message =  "⚠ 找不到收件字資料。";
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = message;
      response.payload = postBody;
    } else {
      // const codes = await cursor.toArray();
      // also send hex object id back 
      // codes.forEach(element => {
      //   element._id = element._id.toString();
      // });
      const message = `🟢 ${postBody.site_code} 找到 ${count} 筆收件字資料`;
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.SUCCESS;
      response.message = message;
      /**
       * extract value object from codes attr
       */
      response.payload = codes.map(code => code.codes);
    }
  } catch (e) {
    console.error(__basename, "❗ 處理取得收件字資訊執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
