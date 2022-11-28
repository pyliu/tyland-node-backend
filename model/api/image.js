const path = require("path");
const config = require(path.join(__dirname, "..", "config"));
const utils = require(path.join(__dirname, "..", "utils"));
const { Worker } = require("worker_threads");
const StatusCodes = require("http-status-codes").StatusCodes;
const { isEmpty } = require("lodash");

module.exports.register = (app) => {
  // get mark image
  app.get("/:case_id/:section_code/:opdate/:land_number/:serial/:distance", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'image', 'get.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        config.isDev && console.log(data);
        res.status(StatusCodes.OK).sendFile(data.payload);
      });
      // params data to generate mark image path
      worker.postMessage(req.params);
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  // store mark image b64 data
  app.put("/:case_id/:section_code/:opdate/:land_number/:serial/:distance", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'image', 'put.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        config.isDev && console.log(data);
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send(data);
      });
      // params data to generate mark image path
      worker.postMessage({
        b64: req.body.b64,
        params: req.params
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  
}
