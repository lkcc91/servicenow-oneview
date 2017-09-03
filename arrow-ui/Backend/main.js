var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

var configJSON;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('../Frontend'));

app.post('/getData', function (req, res) {
    // console.log(req.body);
    configJSON = req.body;

    fs.writeFileSync('../../arguments.json', JSON.stringify(configJSON));

    res.end("asd");
});

app.get('/sendData', function (req, res) {
    fs.access('arguments.json', fs.constants.R_OK, function (err) {
        if (err) {
            console.log("Arguments.json doesn't exist, will create new file when configJSON is sent")
            res.end();
        }
        else {
            res.end(fs.readFileSync('../../arguments.json'));
        }
    });
});


app.listen(3005, function () {
    console.log('Example app listening on port 3005!')
})

