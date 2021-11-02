const path = require('path');
const { parentPort } = require('worker_threads');
const md5 = require('md5')
const userDB = require(path.join(__dirname, '..', 'user-db.js'))

parentPort.on('message', loginInfo => {
    const db = new userDB();
    const user = db.getUser(loginInfo.username);
    const response = {
      loggedIn: md5(loginInfo.password) === user?.pw,
      user: user
    }
    parentPort.postMessage({ token: response });
});