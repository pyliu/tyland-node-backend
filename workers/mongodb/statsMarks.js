const path = require("path");
const fs = require("fs");
const __basename = path.basename(__filename);
const { parentPort } = require("worker_threads");
const config = require(path.join(__dirname, "..", "..", "model", "config"));
const MongoClient = require("mongodb").MongoClient;

parentPort.on("message", async (params) => {
  /**
   * expect params e.g.: {
        "site_code": "HA",
        "st_date": "2022-11-01",
        "ed_date": "2022-11-20"
      }
   */
  config.isDev && console.log("收到計算界標數訊息", params);
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
    message: `找不到 ${params.st_date} ~ ${params.ed_date} ${site} 已建立的界標`,
    payload: baseFolder
  };
  try {
    const client = new MongoClient(config.connUri);
    await client.connect();
    config.isDev && console.log(__basename, "👌 繼續執行搜尋已建立的界標 ... ", params);
    const caseCollection = client.db().collection(config.caseCollection);

    const limit = params.limit || 0;
    delete params.limit;

    // prepare search criteria
    // support multiple sites querying
    const filter = {
      code: new RegExp(`^${site}`, 'g')
    }

    config.isDev && console.log(__basename, `計算 ${site} 已建立的界標數： limit: ${limit} code: ${filter.code}`);

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
    
    response.statusCode = config.statusCode.SUCCESS;
    response.message = `找到 ${marks.length} 筆界標資料`;
    response.payload = marks.length;
    
  } catch (e) {
    response.message = e.toString();
    console.error(__basename, '❗ 處理計算已建立的界標時MONGODB連線執行期間錯誤', e);
  } finally {
    parentPort.postMessage(response);
  }
});
