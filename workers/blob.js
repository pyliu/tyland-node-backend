const fs = require("fs-extra");
const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));

parentPort.on("message", async (inData) => {
  config.isDev && console.log("收到更新界標影像請求", inData);
  const body = inData.body;
  const params = inData.params;
  let response = {
    statusCode: config.statusCode.FAIL,
    message: "未知的錯誤",
    payload: undefined,
  };
  try {
    // const baseFolder = path.join(
    //   __dirname,
    //   "..",
    //   config.uploadPath,
    //   `${caseData.year}-${caseData.code}-${caseData.num}`
    // );
    // const dest = path.join(baseFolder, setData.section, setData.opdate);
    // fs.ensureDir(dest, (err) => {
    //   err && console.error(err);
    //   const src = path.join(
    //     baseFolder,
    //     caseData.origSection,
    //     caseData.origOpdate
    //   );
    //   const dirs = fs
    //     .readdirSync(src, { withFileTypes: true })
    //     .filter((dirent) => dirent.isDirectory())
    //     .map((dirent) => dirent.name);
    //   dirs.forEach((theDir, idx, arr) => {
    //     const srcDir = path.join(src, theDir);
    //     const destDir = path.join(dest, theDir);
    //     fs.move(srcDir, destDir, (err) => {
    //       if (err) return console.error(err);
    //       config.isDev && console.log(`${srcDir} → ${destDir}`);
    //     });
    //   });
    // });
  } catch (e) {
    console.error(__basename, "❗ 處理更新界標影像執行期間錯誤", e);
    response.payload = e;
  } finally {
    parentPort.postMessage(response);
  }
});
