const path = require("path");
const { parentPort } = require("worker_threads");
const userDB = require(path.join(__dirname, "..", "user-db.js"));

parentPort.on("message", (clientId) => {
  const db = new userDB();
  const user = db.getUser(clientId);
  const response = {user};
  parentPort.postMessage({user});
});
