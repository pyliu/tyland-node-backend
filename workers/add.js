const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到新增案件訊息", postBody);
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  // force set section as string
  postBody.section= postBody.section.toString();
  try {
    await client.connect();
    config.isDev && console.log(__basename, "👌 已通過認證，繼續執行新增案件 ... ");
    const caseCollection = client.db().collection(config.caseCollection);
    const caseFilter = {
      year: postBody.year,
      code: postBody.code,
      num: postBody.num,
      opdate: postBody.opdate,
      section: postBody.section
    };
    const regCase = await caseCollection.findOne(caseFilter);
    if (isEmpty(regCase)) {

      const caseDoc = { ...postBody };
      delete caseDoc.token;
      const result = await caseCollection.insertOne(caseDoc);

      const statusCode = result.acknowledged ? config.statusCode.SUCCESS : config.statusCode.FAIL;
      const message =  result.acknowledged ? `✔ 新增案件資料成功(_id: ${result.insertedId})` : "❌ 新增案件失敗!";

      config.isDev && console.log(__basename, message);

      response.statusCode = statusCode;
      response.message = message;
      response.payload = result;
    } else {
      config.isDev && console.log(__basename, "⚠ 案件已存在，無法新增‼");
      response.statusCode = config.statusCode.FAIL_DUPLICATED;
      response.message = "⚠ 案件已存在!";
      response.payload = caseFilter;
    }
  } catch (e) {
    console.error(__basename, "❗ 處理新增案件執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
