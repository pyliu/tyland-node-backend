const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

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
        "site_code": "HA",
        "st_date": "2022-11-01",
        "ed_date": "2022-11-20"
      }
   */
  config.isDev && console.log("收到計算已上傳圖檔訊息", params);
  // extract site info from code value
  const site = params.site_code?.toUpperCase();
  const baseFolder = path.join(
    __dirname,
    "..",
    config.uploadPath,
    site
  );
  const response = {
    statusCode: config.statusCode.FAIL,
    message: `找不到 ${params.st_date} ~ ${params.ed_date} ${site} 已上傳的圖檔`,
    payload: baseFolder
  };
  try {
    const client = new MongoClient(config.connUri);
    const limit = params.limit || 0;
    delete params.limit;

    const filter = {}

    // support multiple sites querying
    filter.code = new RegExp(`^${site}`, 'g');

    config.isDev && console.log(__basename, `計算 ${site} 已上傳圖檔參數： limit: ${limit} code: ${filter.code}`);

    // prepare search criteria
    const criteria = {};
    const lastCriteria = {};

    criteria["lands.marks.opdate"] = {
      "$gte": params.st_date,
      "$lte": params.ed_date
    };
    lastCriteria["mark.opdate"] = params.opdate;


    config.isDev && console.log(criteria);
    
    const agg = [
      {
        '$match': criteria
      }, {
        '$project': {
          '_id': 0, 
          'mark': '$lands.marks'
        }
      }, {
        '$unwind': {
          'path': '$mark'
        }
      }, {
        '$unwind': {
          'path': '$mark'
        }
      }, {
        '$match': lastCriteria
      }
    ];

    const cursor = await caseCollection.aggregate(agg);
    const docs = await cursor.toArray();

    const marks = docs.map(document => { return { ...document.mark }; });
    
    const message = `🟢 找到 ${marks.length} 筆界標資料`;
    config.isDev && console.log(__basename, message);
    response.statusCode = config.statusCode.SUCCESS;
    response.message = message;
    response.payload = marks;

  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理計算已上傳圖檔時MONGODB連線執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
