const path = require("path");
const config = require(path.join(__dirname, "..", "config"));
const utils = require(path.join(__dirname, "..", "utils"));
const { Worker } = require("worker_threads");
const StatusCodes = require("http-status-codes").StatusCodes;

module.exports.register = (app) => {
  /**
   * calculates stats by file system
   */
  app.get("/stats/:site_code/uploaded", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'fs', 'uploaded.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({ site_code: req.params.site_code });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  app.get("/stats/:site_code/cases", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'fs', 'cases.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({ site_code: req.params.site_code });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  app.get("/stats/:site_code/marks", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'fs', 'marks.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({ site_code: req.params.site_code });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  /**
   * mongodb stats by post API
   */
  app.post("/stats/mongodb/uploaded/:site_code/:st_date/:ed_date", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'uploaded.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({
        site_code: req.params.site_code,
        st_date: req.params.st_date,
        ed_date: req.params.ed_date
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  app.post("/stats/mongodb/marks/:site_code/:st_date/:ed_date", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'marks.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({
        site_code: req.params.site_code,
        st_date: req.params.st_date,
        ed_date: req.params.ed_date
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
  app.post("/stats/mongodb/cases/:site_code/:st_date/:ed_date", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'stats', 'cases.js'));
      // listen to message to wait response from worker
      worker.on("message", (data) => {
        res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
      });
      // post data
      worker.postMessage({
        site_code: req.params.site_code,
        st_date: req.params.st_date,
        ed_date: req.params.ed_date
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({});
    }
  })
}
