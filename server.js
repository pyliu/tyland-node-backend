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
 * Upload API
 */
const uploadAPI = require('./model/api/upload');
uploadAPI.register(app);

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
