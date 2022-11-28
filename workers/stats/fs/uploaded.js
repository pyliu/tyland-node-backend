const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  })
  return arrayOfFiles;
}

parentPort.on("message", async (params) => {
  /**
   * expect params e.g.: {
        "site_code": "HA"
      }
   */
  // extract site info from code value
  const site = params.site_code?.toUpperCase();
  const folder = path.join(
    __dirname,
    "..",
    config.uploadPath,
    site
  );
  const response = {
    statusCode: config.statusCode.FAIL,
    message: `找不到 ${site} 已上傳的圖檔`,
    payload: folder
  };
  try {
    const existed = fs.existsSync(folder);
    response.statusCode = existed ? config.statusCode.SUCCESS : config.statusCode.FAIL;
    if (existed) {
      const files = getAllFiles(folder, []);
      response.message = `找到 ${files.length} 個檔案 ▶ (${folder})`;
      response.payload = files.length;
    }
    // existed && (response.message = `找到檔案 ▶ (${filepath})`);
    // existed && (response.payload = folder);
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
