const path = require("path");
const { parentPort } = require("worker_threads");
const userDB = require(path.join(__dirname, "..", "user-db.js"));

parentPort.on("message", (authorizationHeader) => {
  // auth header, e.g. "Bearer 1dca1747faea2a040d8adedba4cb44ec"
  const token = authorizationHeader.replace('Bearer ', '')
  const db = new userDB();
  const user = db.getUserByToken(token);
  parentPort.postMessage({...user});
});
