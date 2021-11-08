const isDev = process.env.NODE_ENV !== 'production';
const compression = require("compression");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { isEmpty } = require("lodash");
const StatusCodes = require("http-status-codes").StatusCodes;
const { Worker } = require("worker_threads");

const dirName = "upload";
const uploadDir = path.join(__dirname, dirName);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

require('dotenv').config()

const app = express();

// const mongoDB = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:27017/tyland`;
// const mongoose = require('mongoose');
// async function main() { await mongoose.connect(mongoDB); }
// main().then(() => console.log('tyland 資料庫已連線。')).catch(err => console.log(err));

// const mongoose = require('mongoose');
// const mongoDB = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:27017/tyland`;
// const mongoose = require('mongoose');
// mongoose.connect(mongoDB)
// const db = mongoose.connection
// db.on('error', function (err) {
//   console.error('MongoDB 連線錯誤:', mongoDB);
//   parentPort.postMessage(data);
// });
// db.once('open', function (err) {
//   if (err) {
//     return console.error(err);
//   } else {
//     console.log('✔ MongoDB連線成功。');
//   }
// });

// middle ware
app.use(compression()); // compress all responses
app.use(express.static(dirName)); // to access the files in `${dirName}` folder
app.use(cors()); // it enables all cors requests
app.use(fileUpload());
app.use( express.urlencoded({ extended: true }) );
app.use(express.json());

// file upload api
app.post("/upload", (req, res) => {
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
  if (isEmpty(req.headers.authorization) || !req.headers.authorization.startsWith("Bearer ")) {
    console.warn('No Authorization header found', req.headers.authorization)
    res.status(StatusCodes.BAD_REQUEST).send({});
  } else {
    const worker = new Worker("./workers/logout.js");
    // listen to message to wait response from worker
    worker.on("message", (data) => {
      res.status(data.ok ? 200 : 401).send({data});
    });
    // send authorization header to worker
    worker.postMessage(req.headers.authorization);
  }
});

app.get("/me", (req, res) => {
  if (isEmpty(req.headers.authorization) || !req.headers.authorization.startsWith("Bearer ")) {
    console.warn('No Authorization header found', req.headers.authorization)
    res.status(StatusCodes.BAD_REQUEST).send({});
  } else {
    const worker = new Worker("./workers/me.js");
    // listen to message to wait response from worker
    worker.on("message", (user) => {
      res.status(isEmpty(user) ? 401 : 200).send({user});
    });
    // send authorization header to worker
    worker.postMessage(req.headers.authorization);
  }
});

app.listen(4500, () => {
  console.log("server is running at port 4500");
});
