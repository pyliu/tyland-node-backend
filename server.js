require('dotenv').config()
const isDev = process.env.NODE_ENV !== 'production';
const compression = require("compression");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const { isEmpty } = require("lodash");
const StatusCodes = require("http-status-codes").StatusCodes;
const { Worker } = require("worker_threads");
const config = require('./model/config');
const utils = require('./model/utils');

const dirName = "upload";
require("./model/initialize")(dirName);

const app = express();

// middle ware
app.use(compression()); // compress all responses
app.use(express.static(dirName)); // to access the files in `${dirName}` folder
app.use(cors()); // it enables all cors requests
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// file upload api
app.post("/upload", (req, res) => {
  if (utils.authenticate(req.headers.authorization)) {
    if (!req.files) {
      return res.status(StatusCodes.NOT_FOUND).send({ msg: "找不到檔案" });
    }
    // accessing the file
    const myFile = req.files.file;
    const storePath = path.join(__dirname, dirName, myFile.name);
    //  mv() method places the file inside public directory
    myFile.mv(storePath, function (err) {
      if (err) {
        console.error(err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ msg: "發生錯誤" });
      }
      // returing the response with file path and name
      return res.send({ name: myFile.name, path: storePath });
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({});
  }
});

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

const SERVER_PORT = process.env.PORT || 4500;
app.listen(SERVER_PORT, () => {
  console.log(`server is running at port ${SERVER_PORT}`);
});
