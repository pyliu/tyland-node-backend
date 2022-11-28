const path = require("path");
const fs = require("fs-extra");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));

parentPort.on("message", async (params) => {
  /**
   * expect params e.g.: {
        "case_id": "110-HA46-000100",
        "section_code": "0001",
        "opdate": "2021-11-27",
        "serial": "1"
      }
   */
  const response = {
    statusCode: config.statusCode.FAIL,
    message: "⚠ 刪除界標資料夾失敗",
    payload: undefined
  };
  try {
    // extract site info from code value
    const code = params.case_id.split('-')[1];
    const site = code.substring(0, 2);
    const dirpath = path.join(
      __dirname,
      "..",
      "..",
      config.uploadPath,
      site,
      params.case_id,
      params.section_code,
      params.opdate,
      params.land_number,
      params.serial
    );
    const existed = fs.existsSync(dirpath);
    if (existed) {
      fs.removeSync(dirpath)
      response.statusCode = config.statusCode.SUCCESS;
      response.message = `✔ 界標檔案資料夾已移除 ▶ (${dirpath})`;
      response.payload = dirpath;
    } else {
      response.statusCode = config.statusCode.SUCCESS;
      response.message = `⛔ 界標檔案資料夾不存在，無須刪除。`;
      response.payload = dirpath;
    }
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理刪除界標影像資料執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
