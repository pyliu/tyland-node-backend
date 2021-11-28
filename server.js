require('dotenv').config()
const isDev = process.env.NODE_ENV !== 'production';
const compression = require("compression");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const { isEmpty } = require("lodash");
const StatusCodes = require("http-status-codes").StatusCodes;
const { Worker } = require("worker_threads");
const config = require('./model/config');
const utils = require('./model/utils');

const dirName = config.uploadPath;
require("./model/initialize")();

const app = express();

// middle ware
app.use(compression()); // compress all responses
app.use(express.static(dirName)); // to access the files in `${dirName}` folder
app.use(cors()); // it enables all cors requests
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/login", (req, res) => {
  const postBody = req.body
  isDev && console.log('👉 收到 Login 請求', postBody);
  if (isEmpty(postBody.userid) || isEmpty(postBody.password)) {
    console.warn('登入資訊為空值。', postBody)
    res.status(StatusCodes.BAD_REQUEST).send({});
  } else {
    const worker = new Worker("./workers/login.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.loggedIn ? StatusCodes.OK : StatusCodes.UNAUTHORIZED).send({
        token: data.token
      });
    });
    // send data to worker
    worker.postMessage(postBody);
  }
});

app.post("/logout", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/logout.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.ok ? StatusCodes.OK : StatusCodes.UNAUTHORIZED).send({ data });
    });
    // send authorization header to worker
    worker.postMessage(req.headers.authorization);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
});

app.get("/me", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/me.js");
    // listen to message to wait response from worker
    worker.on("message", (user) => {
      res.status(isEmpty(user) ? StatusCodes.UNAUTHORIZED : StatusCodes.OK).send({ user });
    });
    // send authorization header to worker
    worker.postMessage(req.headers.authorization);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
});

app.post("/add", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/add.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
    });
    // post data
    worker.postMessage(req.body);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
})

app.post("/update", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/update.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
    });
    // post data
    worker.postMessage(req.body);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
})

app.post("/search", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/search.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
    });
    // post data
    worker.postMessage(req.body);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
})

app.post("/user", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/user.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
    });
    // post data
    worker.postMessage(req.body);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
})

app.get("/:case_id/:section_code/:opdate/:serial/:distance", (req, res) => {
  // if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/mark.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      isDev && console.log(data);
      res.status(StatusCodes.OK).sendFile(data.payload);
    });
    // params data to generate mark image path
    worker.postMessage(req.params);
  // } else {
  //   res.status(StatusCodes.BAD_REQUEST).send({});
  // }
})

app.put("/:case_id/:section_code/:opdate/:serial/:distance", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    const worker = new Worker("./workers/blob.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      isDev && console.log(data);
      es.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send(data);
    });
    // params data to generate mark image path
    worker.postMessage({
      body: req.body,
      params: req.params
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
})

// file upload api
app.post("/:case_id/:section_code/:opdate/:serial/:distance", (req, res) => {
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
    const folder = path.join(
      __dirname,
      dirName,
      params.case_id,
      params.section_code,
      params.opdate,
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
        message: "✔ 上傳成功",
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

const SERVER_PORT = process.env.PORT || 4500;
app.listen(SERVER_PORT, () => {
  console.log(`伺服器已於 ${SERVER_PORT} 埠號啟動。`);
});
