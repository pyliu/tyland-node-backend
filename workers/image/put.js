const fs = require("fs-extra");
const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));

parentPort.on("message", async (inData) => {
  config.isDev && console.log("收到更新界標影像請求", inData);
  const b64 = inData.b64;
  const params = inData.params;
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined,
  };
  try {
    // extract site info from code value
    const code = params.case_id.split('-')[1];
    const site = code.substring(0, 2);
    const folder = path.join(
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
    fs.ensureDirSync(folder);
    const storePath = path.join(folder, `${params.distance}.jpg`);
    const base64Data = b64.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFileSync(storePath, base64Data, 'base64');
    response.statusCode = config.statusCode.SUCCESS;
    response.message = `✔ 上傳界標影像成功`;
    response.payload = storePath;
  } catch (e) {
    console.error(__basename, "❗ 處理更新界標影像執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
  }
});
