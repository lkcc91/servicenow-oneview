// (C) Copyright 2015-2016 Hewlett Packard Enterprise Development LP
'use strict';

var request = require('request');
var https = require('https'); // https://nodejs.org/api/https.html
var errors = require('../common/error');
var Const = require('../common/const');
var c2p = require('../common/utils').c2p;
var fs = require('fs');
var isDev = require('../common/utils').isDevEnv();
var getId = require('../common/utils').getApplianceIdFromUri;
var utils = require('../common/utils');
var _ = require('lodash');
var log = require('../common/log');

var OneViewClient = {
  
  performGetRequest: function(ipAddress, endpoint, method, sessionId, success) {
    var data = {};
    var dataString = JSON.stringify(data);
    var options = {
      rejectUnauthorized: false,
      forever: true,
      requestCert: true,
      host: ipAddress,
      path: endpoint,
      method: method,
      headers: {
      'Content-Type': 'application/json',
      'X-API-Version': Const.DEFAULT_API_VERSION
    }
    };
    if (sessionId) {
        options.headers.auth = sessionId;
    }

    var req = https.request(options, function(res) {
      res.setEncoding('utf-8');

      var responseString = '';

      res.on('data', function(data) {
        responseString += data;
      });

      res.on('end', function() {
        var responseObject = JSON.parse(responseString);//check if error exists
        // check if "errorCode" field exists in the response
        if ("errorCode" in responseObject) {
          // Error exists
          log.error('oneviewClient : performGetRequest: error in response')
          success(null, responseObject);
        } else {
          success(true, responseObject);      
        }
        
      });
    });

    req.write(dataString);
    req.end();
  },

  //OV POST Request handler
  performPostRequest: function(ipAddress, endpoint, sessionId, data, callback1) {

      var dataString = JSON.stringify(data);

      log.info({
        ipAddress, endpoint, data: dataString.replace(/"password":".*"/gi, '"password":"xxxx"')
      }, 'send POST to OneView');
      var options = {
        rejectUnauthorized: false,
        forever: true,
        requestCert: true,
        host: ipAddress,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Version': 300
        }
      };

      if (sessionId) {
        options.headers.auth = sessionId;
      }

      // var https = require("https");
      var req = https.request(options, function(res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function(data) {
          responseString += data;
        });

        res.on('end', function() {
          var responseObject = JSON.parse(responseString);

          // check if "errorCode" field exists in the response
          if ("errorCode" in responseObject) {
            // Error exists
            log.error('oneviewClient : performPostRequest: error in response')
            callback1(res.req._headers.host, null, responseObject);
          } else {
            callback1(res.req._headers.host, responseObject);
          }
        });

    });

    req.on('error', function(e) {
      log.error({
        e
      }, 'performPostRequest : POST get error');
      callback1(null, null, e);
    });

    // Send in the user credentials
    req.write(dataString);
    req.end();
  },

  performPutRequest: function(ipAddress, endpoint, sessionId, data, callback1) {


    var dataString = JSON.stringify(data);


    log.debug({
      ipAddress, endpoint, data: dataString.replace(/"password":".*"/gi, '"password":"xxxx"')
    }, 'send PUT to OneView');
    var options = {
      rejectUnauthorized: false,
      forever: true,
      requestCert: true,
      host: ipAddress,
      path: endpoint,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 300
      }
    };

    if (sessionId) {
      options.headers.auth = sessionId;
    }

    log.debug("performPutRequest: options: ", options);

    // var https = require("https");
    var req = https.request(options, function(res) {
      res.setEncoding('utf-8');
      var responseString = '';

      res.on('data', function(data) {
        responseString += data;
      });

      res.on('end', function() {
        var responseObject = JSON.parse(responseString);

        // check if "errorCode" field exists in the response
        if ("errorCode" in responseObject) {
          // Error exists
          log.error(responseObject, "error in response");
          callback1(res.req._headers.host, null, responseObject);
        } else {
          callback1(res.req._headers.host, responseObject);
        }
      });

    });

    req.on('error', function(e) {
      log.error({
        e
      }, 'PUT get error');
      callback1(null, null, e);
    });

    // Send in the user credentials
    req.write(dataString);
    req.end();
  },

  /**
   * make a default rest request option,
   * or merge with input option
   * option and sessionID are optional
   */
  makeOption: function(ip, uri, option, sessionID) {
    var newOption = {};
    let uriFromRoot = uri.indexOf('/') == 0 ? uri : '/' + uri;
    let proto=ip.toLowerCase()===Const.LOCALHOST?'http://':'https://';
    if ( !option ) {
      // default option
      newOption = {
        method: 'GET',
        uri: `${proto}${ip}${uriFromRoot}`,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': Const.DEFAULT_API_VERSION
        },
        rejectUnauthorized: false,
        requestCert: true
      };
    } else {
      // merge with input option
      newOption = _.cloneDeep(option);
      newOption.method = newOption.method || 'GET';
      newOption.uri = `${proto}${ip}${uriFromRoot}`;
      if (!newOption.headers) {
        newOption.headers = {
          'Content-Type': 'application/json',
          'X-API-Version': Const.DEFAULT_API_VERSION
        };
      }
      newOption.headers['Content-Type'] = 'application/json';
      newOption.rejectUnauthorized = !!newOption.rejectUnauthorized;
      newOption.requestCert = true;
      // default api version
      if (!newOption.headers['X-API-Version']) {
        newOption.headers['X-API-Version'] = Const.DEFAULT_API_VERSION;
      }
    };
    if (sessionID) {
      newOption.headers.auth = sessionID;
    };
    return newOption;
  }
}

module.exports = OneViewClient;
