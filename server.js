require('dotenv').config()
const config = require('./model/config');
const utils = require('./model/utils');
const compression = require("compression");
const express = require("express");
const https = require('https');
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const StatusCodes = require("http-status-codes").StatusCodes;

const dirName = config.uploadPath;
require("./model/initialize")();

const app = express();

// middle ware
app.use(compression()); // compress all responses
app.use(express.static(dirName)); // to access the files in `${dirName}` folder
app.use(cors()); // it enables all cors requests
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit : 5242880})); // allow maximum 5MB json payload

/**
 * Auth API
 */
 const authAPI = require('./model/api/auth');
 authAPI.register(app);
 /**
  * Case API
  */
const caseAPI = require('./model/api/case');
caseAPI.register(app);
/**
 * User API
 */
 const userAPI = require('./model/api/user');
 userAPI.register(app);
 /**
  * Search API
  */
const searchAPI = require('./model/api/search');
searchAPI.register(app);
 /**
  * Image API
  */
const imageAPI = require('./model/api/image');
imageAPI.register(app);
/**
 * Mark API
 */
const markAPI = require('./model/api/mark');
markAPI.register(app);
/**
 * Stats API
 */
 const statsAPI = require('./model/api/stats');
 statsAPI.register(app);
/**
 * Codes API
 */
const codesAPI = require('./model/api/codes');
codesAPI.register(app);
/**
 * Sections API
 */
const sectionsAPI = require('./model/api/sections');
sectionsAPI.register(app);
/**
 * file upload api
 */
app.post("/:case_id/:section_code/:opdate/:land_number/:serial/:distance", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    if (!req.files) {
      return res.status(StatusCodes.NOT_FOUND).send({ msg: "找不到上傳的檔案" });
    }
    // accessing the file
    const myFile = req.files.file;
    const params = req.params;
    /**
     * expect params e.g.: {
          "case_id": "110-HA46-000100",
          "section_code": "0001",
          "opdate": "2021-11-27",
          "serial": "1",
          "distance": "far"
        }
    */
    // extract site info from code value
    const code = params.case_id.split('-')[1];
    const site = code.substring(0, 2);
    const folder = path.join(
      __dirname,
      dirName,
      site,
      params.case_id,
      params.section_code,
      params.opdate,
      params.land_number,
      params.serial
    );
    fs.ensureDirSync(folder);
    const storePath = path.join(folder, `${params.distance}.jpg`);
    //  mv() method places the file inside public directory
    myFile.mv(storePath, function (err) {
      if (err) {
        console.error(err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({
            statusCode: config.statusCode.FAIL,
            message: `⚠ 上傳檔案發生錯誤 (${err.toString()})`
          });
      }
      // returing the response with file path and name
      return res.status(StatusCodes.OK).send({
        statusCode: config.statusCode.SUCCESS,
        message: "✔ 上傳界標影像原始檔成功",
        path: storePath
      });
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({
      statusCode: config.statusCode.FAIL,
      message: "請先登入系統❗"
    });
  }
});

const privateKey  = fs.readFileSync(path.resolve(__dirname, 'key', config.isProd ? 'server.key' : 'localhost-key.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname, 'key', config.isProd ? 'server.crt' : 'localhost.pem'));
const credentials = { key: privateKey, cert: certificate};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(process.env.PORT || 4500, () => {
  console.log(`伺服器已於 ${process.env.PORT || 4500} 埠號啟動。`);
});

// const SERVER_PORT = process.env.PORT || 4500;
// app.listen(SERVER_PORT, () => {
//   console.log(`伺服器已於 ${SERVER_PORT} 埠號啟動。`);
// });
