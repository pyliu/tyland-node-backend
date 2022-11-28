const fs = require("fs-extra");
const path = require("path");
const __basename = path.basename(__filename);
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
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

    
    // extract site info from code value
    const site = caseData.code.substring(0, 2);

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

        // if the section/opdate changed, the mark images need to be moved to new position
        if (
          (setData.section && (setData.section !== caseData.origSection))
          ||
          (setData.opdate && (setData.opdate !== caseData.origOpdate))
        ) {
          const baseFolder = path.join(
            __dirname,
            "..",
            "..",
            config.uploadPath,
            site,
            `${caseData.year}-${caseData.code}-${caseData.num}`
          );
          const dest = path.join(
            baseFolder,
            setData.section,
            setData.opdate
          );
          fs.ensureDir(dest, (err) => {
            err && console.error(err);
            const src = path.join(
              baseFolder,
              caseData.origSection,
              caseData.origOpdate
            );
            const dirs = fs.readdirSync(src, { withFileTypes: true })
              .filter(dirent => dirent.isDirectory())
              .map(dirent => dirent.name);
            dirs.forEach((theDir, idx, arr) => {
              const srcDir = path.join(src, theDir);
              const destDir = path.join(dest, theDir);
              fs.copy(srcDir, destDir, { overwrite: true }, (err) => {
                if (err) return console.error(err);
                config.isDev && console.log(`${theDir} → ${destDir}`, "複製成功");
                fs.remove(srcDir, err => {
                  if (err) return console.error(err)
                  console.log(srcDir, "移除成功");
                })
              });
            });
          });
          // fs.moveSync(src, dest, { overwrite: true });
        }
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
