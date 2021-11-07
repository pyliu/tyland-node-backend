const path = require("path");
const { parentPort } = require("worker_threads");
const mongoUser = require(path.join(__dirname, "..", "model", "user.js"));

parentPort.on("message", (authorizationHeader) => {
  // auth header, e.g. "Bearer 1dca1747faea2a040d8adedba4cb44ec"
  const hash = authorizationHeader.replace("Bearer ", "");
  mongoUser.find({ token: { hash } }).exec(function (err, docs) {
    if (err) {
      parentPort.postMessage({});
      return console.error(err);
    }
    parentPort.postMessage({ ...docs });
  });
});
