const { parentPort } = require('worker_threads');
const md5 = require('md5')
const userDB = require(path.join(__dirname, 'user-db.js'))

parentPort.on('message', loginInfo => {
    const user = userDB.getUser(loginInfo.username);
    let loggedIn = false
    if (user) {
      loggedIn = md5(loginInfo.password) === user.pw
      console.info(userDB.getUser(loginInfo.username));
      console.log('password OK? ', loggedIn)
    }
    parentPort.postMessage(loggedIn);
});