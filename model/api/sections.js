const path = require("path");
const config = require(path.join(__dirname, "..", "config"));
const utils = require(path.join(__dirname, "..", "utils"));
const { Worker } = require("worker_threads");
const StatusCodes = require("http-status-codes").StatusCodes;

module.exports.register = (app) => {
  /**
   * RESTFul APPI for section
   */
  app.get("/sections/:site_code", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'code', 'getSections.js'));
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
  // To create new section entry
  app.post("/sections/:site_code/:section_id/:section_name", (req, res) => {
   if (utils.authenticate(req.headers.authorization)) {
     const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'code', 'postSection.js'));

     // listen to message to wait response from worker
     worker.on("message", (data) => {
       res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
     });
     // post data
     worker.postMessage({
       site_code: req.params.site_code,
       section_id: req.params.section_id,
       section_name: req.params.section_name
     });
   } else {
     res.status(StatusCodes.BAD_REQUEST).send({});
   }
  })
  // To delete section entry
  app.delete("/sections/:site_code/:code_id", (req, res) => {
   if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'code', 'deleteSection.js'));
     // listen to message to wait response from worker
     worker.on("message", (data) => {
       res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
     });
     // post data
     worker.postMessage({
       site_code: req.params.site_code,
       code_id: req.params.code_id,
       post: req.body
     });
   } else {
     res.status(StatusCodes.BAD_REQUEST).send({});
   }
  })
  // To update section entry
  app.put("/sections/:site_code/:code_id/:code_name", (req, res) => {
   if (utils.authenticate(req.headers.authorization)) {
      const worker = new Worker(path.join(__dirname, '..', '..', 'workers', 'code', 'putSection.js'));
     // listen to message to wait response from worker
     worker.on("message", (data) => {
       res.status(data.statusCode === config.statusCode.FAIL ? StatusCodes.NOT_ACCEPTABLE : StatusCodes.OK).send({ ...data });
     });
     // post data
     worker.postMessage({
       site_code: req.params.site_code,
       code_id: req.params.code_id,
       code_name: req.params.code_name,
       post: req.body
     });
   } else {
     res.status(StatusCodes.BAD_REQUEST).send({});
   }
  })
}
