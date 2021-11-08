const isDev = process.env.NODE_ENV !== 'production';
const path = require("path");
const md5 = require("md5");
const isEmpty = require("lodash/isEmpty");
const { parentPort } = require("worker_threads");
// const Database = require("better-sqlite3");
// const getUser = require(path.join(__dirname, "..", "model", "user.js"))
const MongoClient = require('mongodb').MongoClient;

parentPort.on("message", async (loginInfo) => {
  const data = { loggedIn: false, token: 'UNAUTHORIZED' };
  isDev && console.log('👉 login worker 設定初始回應資料', data);
  parentPort.postMessage(data);
  try {

    MongoClient.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:27017/tyland`, function (err, db) {
      if(err) throw err;
      isDev && console.log('✔ DB已連線', db);
      //Write databse Insert/Update/Query code here..
      db.collection('users', function(err, collection){
        collection.find({ _id: loginInfo.userid }).toArray(function (err, items) {
          if(err) throw err;
          const user = items[0];
          if (!isEmpty(user)) {
            isDev && console.log('✔ 找到使用者資料', user);
            if (user && user.pwd === md5(loginInfo.password)) {
              isDev && console.log('✔ 登入成功');
              data.loggedIn = true;
              data.token = md5(+new Date() + loginInfo.userid);
              const token = {
                hash: data.token,
                expire: +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
              };
              // 第一個參數是要更新的條件，第二個參數$set:更新的欄位及內容.
              // 第三個參數writeConcern，第四個參數執行update後的callback函式
              collection.update(
                { _id: loginInfo.userid },
                { $set: { token: token } },
                {w:1},
                function(err, result) {
                  if(err) throw err;
                  isDev && console.log('✔ 使用者存取 token 已更新。');
                }
              );
            }
          } else {
            isDev && console.log('❌ 登入失敗', { _id: loginInfo.userid });
          }
          parentPort.postMessage(data);
        });
      });
      db.close(); //關閉連線
    });

  //   isDev && console.log('🔎 尋找使用者資料 ... ', loginInfo);
  //   const user = await getUser(loginInfo.userid);
  //   isDev && console.log('🔎 搜尋結果', user);
  //   if (!isEmpty(user)) {
  //     isDev && console.log('✔ 找到使用者資料', user);
  //     if (user && user.pwd === md5(loginInfo.password)) {
  //       isDev && console.log('✔ 登入成功');
  //       data.loggedIn = true;
  //       data.token = md5(+new Date() + loginInfo.userid);
  //       const token = {
  //         hash: data.token,
  //         expire: +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
  //       };
  //       user.token = token;
  //       user.save(function(err) {
  //         if (err) return console.error(err);
  //       });
  //     }
  //   } else {
  //     isDev && console.log('❌ 登入失敗', { _id: loginInfo.userid });
  //   }
  //   parentPort.postMessage(data);

    // userModel.find({ _id: loginInfo.userid }, function (err, user) {
    //   if(err) {
    //     parentPort.postMessage(data);
    //     return console.error(err)
    //   }
    //   if (!isEmpty(user)) {
    //     isDev && console.log('✔ 找到使用者資料', user);
    //     if (user && user.pwd === md5(loginInfo.password)) {
    //       isDev && console.log('✔ 登入成功');
    //       data.loggedIn = true;
    //       data.token = md5(+new Date() + loginInfo.userid);
    //       const token = {
    //         hash: data.token,
    //         expire: +new Date() + loginInfo.maxAge * 1000 //Date.now() milliseconds 微秒數
    //       };
    //       user.token = token;
    //       user.save(function(err) {
    //         if (err) return console.error(err);
    //       });
    //     }
    //   } else {
    //     isDev && console.log('❌ 登入失敗', { _id: loginInfo.userid });
    //   }
    //   parentPort.postMessage(data);
    // });
  } catch (e) {
    isDev && console.error('❗ 處理登入執行期間錯誤', e);
    parentPort.postMessage(data);
  }
});
