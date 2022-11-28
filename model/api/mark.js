const path = require("path");
const config = require(path.join(__dirname, "..", "config"));
const utils = require(path.join(__dirname, "..", "utils"));
const { Worker } = require("worker_threads");
const StatusCodes = require("http-status-codes").StatusCodes;

module.exports.register = (app) => {
  // delete mark
  app.delete("/:case_id/:section_code/:opdate/:land_number/:serial", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'mark', 'delete.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        config.isDev && console.log(data);
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send(data);
      });
      // params data to generate mark dir path
      worker.postMessage(req.params);
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
}
