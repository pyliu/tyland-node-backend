const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (postBody) => {
  config.isDev && console.log("收到新增案件訊息", postBody);
  // auth token, e.g. "1dca1747faea2a040d8adedba4cb44ec"
  const hash = postBody.token;
  const client = new MongoClient(config.connUri);
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined
  };
  try {
    await client.connect();
    config.isDev && console.log(__basename, "✔ DB已連線");
    const userCollection = client.db().collection(config.userCollection);
    const tokenFilter = { "token.hash": hash };
    const user = await userCollection.findOne(tokenFilter);
    if (isEmpty(user)) {
      config.isDev && console.log(__basename, "❌ 找不到使用者資料", tokenFilter);
      response.statusCode = config.statusCode.FAIL_NOT_FOUND;
      response.message = "❌ 找不到使用者資料";
      response.payload = tokenFilter;
    } else {
      config.isDev && console.log(__basename, "🔎 檢查 token 是否已過期", hash);
      const expire = user.token.expire;
      const now = +new Date();
      if (now > expire) {
        config.isDev && console.log(__basename, "❌ token 已過期，需重新登入!", hash);
        response.statusCode = config.statusCode.FAIL_EXPIRE;
        response.message = "❌ token 已過期，需重新登入!";
        response.payload = tokenFilter;
      } else {
        config.isDev && console.log(__basename, "👌 已通過認證，繼續執行新增案件 ... ");
        // authenticated
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
          response.statusCode = config.statusCode.FAIL_DUPLICATED;
          response.message = "⚠ 案件已存在!";
          response.payload = caseFilter;
        }
      }
    }
  } catch (e) {
    console.error(__basename, "❗ 處理登入執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
