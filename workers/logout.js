const path = require("path");
const { parentPort } = require("worker_threads");
const userDB = require(path.join(__dirname, "..", "user-db.js"));

parentPort.on("message", (authorizationHeader) => {
  const token = authorizationHeader.replace('Bearer ', '')
  const db = new userDB();
  const user = db.getUserByToken(token);
  const data = { ok: false, message: `找不到使用者(token: ${token})` };
  if (user) {
    // reset access token, params keys match the db schema
    data.ok = db.setUserAccessToken({ id: user.id, token: null, token_expiretime: null });
    data.message = `${user.id} ${user.name} token 已移除`;
  }
  parentPort.postMessage(data);
});
