// ref: https://reactgo.com/vue-file-upload/
const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()


const dirName = 'upload'
const uploadDir = path.join(__dirname, dirName)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// middle ware
app.use(express.static(dirName)) //to access the files in `${dirName}` folder
app.use(cors()) // it enables all cors requests
app.use(fileUpload())

// file upload api
app.post('/upload', (req, res) => {

    if (!req.files) {
        return res.status(500).send({ msg: "file is not found" })
    }
        // accessing the file
    const myFile = req.files.file

    //  mv() method places the file inside public directory
    myFile.mv(`${__dirname}/${dirName}/${myFile.name}`, function (err) {
        if (err) {
            console.log(err)
            return res.status(500).send({ msg: "Error occured" })
        }
        // returing the response with file path and name
        return res.send({name: myFile.name, path: `/${myFile.name}`})
    })
})


app.listen(4500, () => {
    console.log('server is running at port 4500')
})
