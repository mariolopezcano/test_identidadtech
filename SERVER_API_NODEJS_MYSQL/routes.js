const express = require('express')
const routes = express.Router()
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const csv = require('fast-csv');
const mysql = require('mysql')

var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
var upload = multer({
    storage: storage
});

const db = mysql.createConnection({
    host:'localhost',
    port: 3306,
    user: 'root',
    password: 'abc123',
    database: 'csvdata'
})
db.connect(function (err) {
    if (err) {
    return console.error('error: ' + err.message);
}
console.log('Connected to the MySQL server.');
})

routes.get('/', (req, res)=>{
    req.getConnection((err, conn)=>{
        if(err) return res.send(err)

        conn.query('SELECT * FROM data_table', (err, rows)=>{
            if(err) return res.send(err)

            res.json(rows)
            console.log('this is rows: ',rows)
        })
    })
})
routes.post('/uploadfile', upload.single("file_csv"),(req, res)=>{
    console.log("This is req from post: ", req.file)
    UploadCsvDataToMySQL(__dirname + '/uploads/' + req.file.filename);
        res.json({
    'msg': 'File uploaded/import successfully!', 'file': req.file
    });
})
function UploadCsvDataToMySQL(filePath){
    console.log("This is the file", filePath)
    let stream = fs.createReadStream(filePath);
    let csvData = [];
    let csvStream = csv
    .parse()
    .on("data", function (data) {
        csvData.push(data);
    })
    .on("end", function () {
    
        let query = 'INSERT INTO data_table (id, column1, column2, column3) VALUES ?';
                db.query(query, [csvData], (error, response) => {
                    console.log(error || response);
                });
    fs.unlinkSync(filePath)
    });
    stream.pipe(csvStream);
}

module.exports = routes     