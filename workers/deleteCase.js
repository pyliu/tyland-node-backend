const path = require("path");
const fs = require("fs-extra");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const { ObjectId, MongoClient } = require("mongodb");

parentPort.on("message", async (data) => {
  const params = data.params;
  /**
   * expect params e.g.: {
        "case_id": "110-HA46-000100",
        "section_code": "0001",
        "opdate": "2021-11-27"
      }
   */
  const response = {
    statusCode: config.statusCode.FAIL,
    message: "⚠ 刪除案件資料失敗",
    payload: undefined
  };
  const client = new MongoClient(config.connUri);
  try {
    await client.connect();
    const caseCollection = client.db().collection(config.caseCollection);
    const _id = data.oid;
    const filter = { _id: new ObjectId(_id) };
    const result = await caseCollection.deleteOne(filter);
    console.log(filter, result);
    if (result.deletedCount > 0) {
      response.statusCode = config.statusCode.SUCCESS;
      response.message = `案件 (${params.case_id}, ${params.section_code}, ${params.opdate}) 已移除。`
      // 移除界標檔案
      const dirpath = path.join(
        __dirname,
        "..",
        config.uploadPath,
        params.case_id,
        params.section_code,
        params.opdate
      );
      const existed = fs.existsSync(dirpath);
      if (existed) {
        fs.removeSync(dirpath);
        response.message = `${response.message} (✔ 案件界標資料已移除。)`;
      } else {
        response.message = `${response.message} (⛔ 案件界標檔案資料夾不存在，無須刪除。)`;
      }
      response.payload = dirpath;
      config.isDev && console.log(response.message);
    } else {
      response.message = `${response.message} (${params.case_id}, ${params.section_code}, ${params.opdate})`;
      config.isDev && console.error(response.message);
    }
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理刪除案件資料執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
    await client.close();
  }
});
