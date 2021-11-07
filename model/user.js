const mongoose = require("mongoose");
module.exports = mongoose.model(
  "user",
  new mongoose.Schema({
    _id: String,
    name: String,
    pwd: Number,
    authority: Number,
    token: {
      hash: String,
      expire: Number,
    },
    note: String,
  })
);
