const compression = require("compression");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const StatusCodes = require("http-status-codes").StatusCodes;

const dirName = "upload";
const uploadDir = path.join(__dirname, dirName);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();

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
  const { Worker } = require("worker_threads");
  const worker = new Worker("./workers/login.js");
  // 監聽: 接收worker回報的資料
  worker.on("message", (response) => {
    console.info(response);
    res.send(response);
  });
  // 傳遞資料給worker
  worker.postMessage(req.body);
});

app.listen(4500, () => {
  console.log("server is running at port 4500");
});
