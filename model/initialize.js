const fs = require("fs-extra");
const path = require("path");
const isEmpty = require("lodash/isEmpty");
const config = require(path.join(__dirname, "config.js"));
const MongoClient = require("mongodb").MongoClient;

const __basename = path.basename(__filename);

module.exports = async function () {
  fs.ensureDirSync(path.join(__dirname, "..", config.uploadPath));
  const client = new MongoClient(config.connUri);
  try {
    await client.connect();
    config.isDev && console.log(__basename, "✔ MongoDB 可正常連線");
    const userCollection = client.db().collection(config.userCollection);
    const idFilter = { id: 'HAADMIN' };
    const admin = await userCollection.findOne(idFilter);
    if (isEmpty(admin)) {
      console.log(__basename, "❌ 找不到管理者資料", idFilter);
      const adminDoc = { "id" : "HAADMIN", "name" : "HA管理者", "pwd" : "2a4c124add170ac85243ab9649aa97f7", "authority" : 1, "note" : "預設帳號", "token" : { "hash" : null, "expire" : null } };
      const result = await userCollection.insertOne(adminDoc);
      console.log(__basename, "✔ 新增管理者資料", `_id: ${result.insertedId}`);
    }
  } catch (e) {
    console.error(__basename, "❗ 處理初始化執行期間錯誤", e);
  } finally {
    await client.close();
  }
}
