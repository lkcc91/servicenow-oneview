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

//var bunyan = require('bunyan');
// var RotatingFileStream = require('bunyan-rotating-file-stream');

// var config = require('../config');
// var utils = require('./utils');

// if (config.log.src === null) {
//   config.log.src = utils.isDevEnv();
// }

// var log = bunyan.createLogger({
//   src: config.log.src,
//   name: 'arrow',
//   hostname: 'local',
//   level: config.log.level,
//   stream: utils.isDevEnv() ? undefined : new RotatingFileStream({
//     path: "/logs/arrow.log",
//     period: config.log.period,                  // Rotation period, e.g. daily, weekly
//     totalFiles: config.log.totalFiles,          // Max number of the archived files
//     rotateExisting: config.log.rotateExisting,  // Try to rotate the log file when we start up
//     threshold: config.log.threshold,            // Rotate log files larger than 'threshold' megabytes
//     totalSize: config.log.totalSize,            // Don't keep more than 'totoalSize' of archived log files
//     gzip: config.log.gzip                       // Compress the archive log files
//   })
// });
var Logger = require('bunyan');
var log = new Logger({
  name: 'arrow',
  streams: [
    {
      stream: process.stdout,
      level: 'debug'
    },
    {
      path: 'arrow.log',
      level: 'info'
    }
  ]
});
module.exports = log;
