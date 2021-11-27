const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));

parentPort.on("message", async (params) => {
  /**
   * expect params e.g.: {
        "case_id": "110-HA46-000100",
        "section_code": "0001",
        "year": "2021",
        "month" "11",
        "day": 26"",
        "serial": "1",
        "distance": "far"
      }
   */
  const response = {
    statusCode: config.statusCode.FAIL,
    message: "找不到檔案",
    payload: path.join(
      __dirname,
      "..",
      config.uploadPath,
      "not_found.jpg"
    )
  };
  try {
    const filepath = path.join(
      __dirname,
      "..",
      config.uploadPath,
      `/${params.case_id}/${params.section_code}/${params.year}/${params.month}/${params.day}/${params.serial}/${params.distance}.jpg`
    );
    const existed = fs.existsSync(filepath);
    response.statusCode = existed ? config.statusCode.SUCCESS : config.statusCode.FAIL;
    existed && (response.message = `找到檔案 ▶ (${filepath})`);
    existed && (response.payload = filepath);
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
