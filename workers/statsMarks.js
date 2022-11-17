const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));

const findMarkFolders = function(dirPath, arrayOfFiles, depth = 1) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const filePath = path.join(dirPath, file);
    if (depth < 5 && fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = findMarkFolders(filePath, arrayOfFiles, depth + 1);
    } else if (depth === 5) {
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
  const sitePath = path.join(
    __dirname,
    "..",
    config.uploadPath,
    site
  );
  const response = {
    statusCode: config.statusCode.FAIL,
    message: `找不到 ${site} 已建立的案件`,
    payload: sitePath
  };
  try {
    const existed = fs.existsSync(sitePath);
    response.statusCode = existed ? config.statusCode.SUCCESS : config.statusCode.FAIL;
    if (existed) {
      const folders = findMarkFolders(sitePath, []);
      response.message = `找到 ${folders.length} 個目錄 ▶ (${sitePath})`;
      response.payload = folders.length;
    }
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理登入執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
