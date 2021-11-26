const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const { ObjectId, MongoClient } = require("mongodb");

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
    
    // find modified case data in case of duplication
    const caseData = postBody.caseData;
    const existed = await caseCollection.findOne({
      year: caseData.year,
      code: caseData.code,
      num: caseData.num,
      ...postBody.setData
    });

    if (isEmpty(existed)) {
      const setData = postBody.setData;
      const result = await caseCollection.updateOne({_id: new ObjectId(postBody._id)}, { $set: { ...setData } });
      config.isDev && console.log(__basename, "✏ 執行結果", result);
      if (result.acknowledged) {
        let statusCode = result.acknowledged ? config.statusCode.SUCCESS : config.statusCode.FAIL;
        let message =  result.modifiedCount === 0 ? "⚠ 沒有更新案件!" : `✔ 更新案件資料成功。`;
        message = `${message} (找到 ${result.matchedCount} 筆，更新 ${result.modifiedCount} 筆)`;
        statusCode = result.modifiedCount === 0 ? config.statusCode.FAIL_NOT_CHANGED : statusCode;

        config.isDev && console.log(__basename, message);

        response.statusCode = statusCode;
        response.message = message;
        response.payload = result;
      } else {
        config.isDev && console.log(__basename, "⚠ 更新案件失敗‼");
        response.statusCode = config.statusCode.FAIL;
        response.message = "⚠ 更新案件失敗‼";
        response.payload = { ...postBody };
      }
    } else {
      config.isDev && console.log(__basename, "⚠ 更新案件失敗‼ (案件已存在)", existed);
      response.statusCode = config.statusCode.FAIL_DUPLICATED;
      response.message = "⚠ 更新案件失敗‼ (案件已存在)";
      response.payload = { ...postBody };
    }
  } catch (e) {
    console.error(__basename, "❗ 處理更新案件執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
