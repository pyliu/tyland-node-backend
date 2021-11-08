const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userModel = mongoose.model(
  'user', 
  new Schema({
    _id: String,
    name: String,
    pwd: Number,
    authority: Number,
    note: String,
    token: {
      hash: String,
      expire: Number,
    }
  }),
  'user'
);

module.exports = (id) => {
  return new Promise(async (resolve, reject) => {
    await userModel.findOne({ _id: id }).exec((err, docs) => {
      err && reject(err);
      resolve(docs);
    });
  });
};

