const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到更新案件訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 已通過認證，繼續執行更新案件 ... ");
    const caseCollection = client.db().collection(config.caseCollection);
    const caseFilter = {
      year: postBody.year,
      code: postBody.code,
      num: postBody.num,
      creator: postBody.creator
    };
    const updateData = {
      section: postBody.section,
      opdate: postBody.opdate
    }
    const result = await caseCollection.updateOne(caseFilter, { $set: { ...updateData } });
    config.isDev && console.log(__basename, "✏ 執行結果", result);
    if (result.acknowledged) {
      const statusCode = result.acknowledged ? config.statusCode.SUCCESS : config.statusCode.FAIL;
      let message =  result.acknowledged ? `✔ 更新案件資料成功。` : "❌ 更新案件失敗!";
      message = `${message} (找到 ${result.matchedCount} 筆，更新 ${result.modifiedCount} 筆)`;

      config.isDev && console.log(__basename, message);

      response.statusCode = statusCode;
      response.message = message;
      response.payload = result;
    } else {
      config.isDev && console.log(__basename, "⚠ 更新案件失敗‼");
      response.statusCode = config.statusCode.FAIL_;
      response.message = "⚠ 更新案件失敗‼";
      response.payload = { ...caseFilter, ...updateData };
    }
  } catch (e) {
    console.error(__basename, "❗ 處理更新案件執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
