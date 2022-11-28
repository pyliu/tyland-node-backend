const path = require("path");
const config = require(path.join(__dirname, "..", "config"));
const utils = require(path.join(__dirname, "..", "utils"));
const StatusCodes = require("http-status-codes").StatusCodes;

module.exports.register = (app) => {
  app.post("/:case_id/:section_code/:opdate/:land_number/:serial/:distance", (req, res) => {
    if (utils.authenticate(req.headers.authorization)) {
      if (!req.files) {
        return res.status(StatusCodes.NOT_FOUND).send({ msg: "找不到上傳的檔案" });
      }
      // accessing the file
      const myFile = req.files.file;
      const params = req.params;
      /**
       * expect params e.g.: {
            "case_id": "110-HA46-000100",
            "section_code": "0001",
            "opdate": "2021-11-27",
            "serial": "1",
            "distance": "far"
          }
      */
      // extract site info from code value
      const code = params.case_id.split('-')[1];
      const site = code.substring(0, 2);
      const folder = path.join(
        __dirname,
        config.uploadPath,
        site,
        params.case_id,
        params.section_code,
        params.opdate,
        params.land_number,
        params.serial
      );
      fs.ensureDirSync(folder);
      const storePath = path.join(folder, `${params.distance}.jpg`);
      //  mv() method places the file inside public directory
      myFile.mv(storePath, function (err) {
        if (err) {
          console.error(err);
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send({
              statusCode: config.statusCode.FAIL,
              message: `⚠ 上傳檔案發生錯誤 (${err.toString()})`
            });
        }
        // returing the response with file path and name
        return res.status(StatusCodes.OK).send({
          statusCode: config.statusCode.SUCCESS,
          message: "✔ 上傳界標影像原始檔成功",
          path: storePath
        });
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({
        statusCode: config.statusCode.FAIL,
        message: "請先登入系統❗"
      });
    }
  });
}
