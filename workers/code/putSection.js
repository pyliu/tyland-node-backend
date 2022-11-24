const path = require("path");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (data) => {
  const site = data.site_code;
  const id = data.code_id;
  const name = data.code_name;
  // const postBody = data.post;
  config.isDev && console.log(`收到修改段小段 ${id} 👉 ${name} 訊息`, data);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, '✔ DB已連線');
    const codeCollection = client.db().collection(config.codeCollection);
    
    // get HX doc in code collection
    const agg = [
      {
        '$match': {
          'site': site
        }
      }
    ];
    const cursor = await codeCollection.aggregate(agg);
    const HXdoc = await cursor.next();
    const found = HXdoc.sections.find((sect) => sect.value === id );
    if (!found) {
      const message =  `⚠ 段小段 ${id} 不存在，無法修改！`;
      config.isDev && console.log(__basename, message);
      response.statusCode = config.statusCode.FAIL;
      response.message = message;
    } else {
      // update found text
      found.text = name
      // store doc back
      const result = await codeCollection.updateOne({ site: site }, { $set: HXdoc });

      config.isDev && console.log(__basename, "✏ 執行結果", result);
      if (result.acknowledged) {
        let statusCode = result.acknowledged ? config.statusCode.SUCCESS : config.statusCode.FAIL;
        let message =  result.modifiedCount === 0 ? `⚠ 沒有修改段小段 ${id} 資料!` : `✔ 修改段小段 ${id} 資料成功。`;
        message = `${message} (找到 ${result.matchedCount} 筆，更新 ${result.modifiedCount} 筆)`;
        statusCode = result.modifiedCount === 0 ? config.statusCode.FAIL_NOT_CHANGED : statusCode;
        config.isDev && console.log(__basename, message);
        response.statusCode = statusCode;
        response.message = message;
        response.payload = result;
      }
    }
  } catch (e) {
    console.error(__basename, '❗ 處理修改段小段資料執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
