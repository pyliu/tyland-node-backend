const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

const getAllFiles = function(dirPath, arrayOfFiles) {
  arrayOfFiles = arrayOfFiles || [];
  try {
    files = fs.readdirSync(dirPath);
    files.forEach(function(file) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    })
    return arrayOfFiles;
  } catch (e) {
    config.isDev && console.error(e, dirPath);
    return arrayOfFiles
  }
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
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行搜尋界標已上傳的圖檔 ... ", params);
    const caseCollection = client.db().collection(config.caseCollection);

    const limit = params.limit || 0;
    delete params.limit;

    // prepare search criteria
    // support multiple sites querying
    const filter = {
      code: new RegExp(`^${site}`, 'g')
    }

    config.isDev && console.log(__basename, `計算 ${site} 已上傳圖檔參數： limit: ${limit} code: ${filter.code}`);

    filter["lands.marks.opdate"] = {
      "$gte": params.st_date,
      "$lte": params.ed_date
    };

    config.isDev && console.log(filter);
    
    const agg = [
      {
        '$match': filter
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
      }
    ];

    const cursor = await caseCollection.aggregate(agg);
    const docs = await cursor.toArray();

    const marks = docs.map(document => { return { ...document.mark }; });
    
    config.isDev && console.log(`找到 ${marks.length} 筆界標資料`);
    /** mark doc example
     {
        doc: '619e0ae763aaf0ec545ed20f',
        year: '110',
        code: 'HA46',
        num: '000100',
        opdate: '2021-11-25',
        section: '0001',
        number: '00010000',
        serial: '1',
        creator: 'HA10013859',
        type: '塑膠樁',
        idx: 0
      }
     */
    let uploadedCounter = 0;
    marks.forEach(mark => {
      // ${baseFolder}\110-HA56-000500\0005\2021-12-07\00900000\1\
      const markFolder = path.join(
        baseFolder,
        `${mark.year}-${mark.code}-${mark.num}`,
        String(mark.section),
        String(mark.opdate),
        String(mark.number),
        String(mark.serial)
      );
      if (fs.existsSync(markFolder)) {
        const files = getAllFiles(markFolder);
        uploadedCounter += files.length;
      }
    });

    response.statusCode = config.statusCode.SUCCESS;
    response.message = `共找到 ${uploadedCounter} 個已上傳的圖檔`;
    response.payload = uploadedCounter;
    
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理計算已上傳圖檔時MONGODB連線執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
