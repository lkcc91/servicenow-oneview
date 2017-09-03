/*
# (C) Copyright (2012-2017) Hewlett Packard Enterprise Development LP
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
*/

/*
 Startup script for node.js server. It loads the required packages and sets message routers.
 */

// Required packages
var express = require('express');
var path = require('path');
var session = require('client-sessions');
var main = require('./main');
var bodyParser  = require('body-parser');
var log = require('./common/log');
var Const = require('./common/const'); // get our creds file
var fs = require('fs');

var app = express();

// Register the static html folder. Browser can load html pages under this folder. 
app.use(express.static(path.join(__dirname, 'public')));

// Register the session. Secret can be an arbitrary string.
app.use(session({
    cookieName: 'session',
    secret: 'af*asdf+_)))==asdf afcmnoadfadf',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create our Express router
var router = express.Router();

//############# UI ####################
app.use(express.static('./arrow-ui/Frontend'));

app.post('/getData', function (req, res) {
    // console.log(req.body);
    configJSON = req.body;

    fs.writeFileSync('arguments.json', JSON.stringify(configJSON));

    res.end("asd");
});

app.get('/sendData', function (req, res) {
    fs.access('arguments.json', fs.constants.R_OK, function (err) {
        if (err) {
            console.log("Arguments.json doesn't exist, will create new file when configJSON is sent")
            res.end();
        }
        else {
            res.end(fs.readFileSync('arguments.json'));
        }
    });
});

//############# UI END #############

var arrowrest = require('./arrowrest');
app.use('/arrow/v1', arrowrest);

// startup initialization 
main.init(function(err){
	main.getHardwareModel();
});

// Finally starts the server.
var port = process.env.PORT || 3000; // used to create, sign, and verify tokens
app.set('superSecret', Const.SECRET); // secret variable

app.listen(port);
log.info("Server listening on: http://localhost:" + port);
