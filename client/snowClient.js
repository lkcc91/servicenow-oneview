

var request = require('request');
var _const = require("../common/const");
var _SESSION_COOKIE = "";
var log = require('../common/log');


module.exports = {

	// https://{instanceName}.service-now.com
	snowLogin: function(instanceURL, username, password, callBack) {
        log.info("snowLogin: Start")
	    request.debug = false;
		request({
			baseUrl : instanceURL,
			method : 'GET',
			uri : _const.SNOW_LOGIN_URI + username,
			json : true,
			// Here we use the basic authentication. The username and password set here will send 
			// as the authentication header.
			auth: {
	            'user': username,
	            'pass': password,
	            'sendImmediately': true
	        }

		}, function(err, response, body) {
			if (!err && response.statusCode == 200){
                _SESSION_COOKIE = response.headers['set-cookie']
                log.debug("snowLogin: _SESSION_COOKIE : ", _SESSION_COOKIE);				
			} else {
				callBack(err, response, body);
			}
		});
	},

    getHardwareModel: function(instanceURL, callBack) {
        log.info("addHardwareModel: Start");
        request.debug = false;
        request({
            baseUrl : instanceURL,
            method : 'GET',
            uri : _const.CMDB_HARDWARE_PRODUCT_MODEL,
            json : true,

            headers: {
                'Cookie': _SESSION_COOKIE
            }

        }, function(err, response, body) {
            if (!err && response.statusCode == 200){
                callBack(err, response, body);
            } else {
                callBack(err, response, body);
            }
        });
    },

    addHardwareModel: function(instanceURL, callBack) {
        log.info("addHardwareModel : Start");
        request.debug = false;
        request({
            baseUrl : instanceURL,
            method : 'POST',
            uri : _const.CMDB_HARDWARE_PRODUCT_MODEL,
            json : true,

            headers: {
                'Cookie': _SESSION_COOKIE
            },
            json: {
                'short_description': "HPE BL 460 Gen9",
                'model_number': "BL 460",
                'display_name': "BL 460 Gen9",
                'barcode': "BL460",
                'name': "HPE BL 460 Gen9"
            }

        }, function(err, response, body) {
            if (!err && response.statusCode == 201){
                callBack(err, response, body);
            } else {
                callBack(err, response, body);
            }
        });
    },

    getTasks: function(instanceURL, callBack) {
        log.info("getTasks : Start");
        request.debug = false;
        request({
            baseUrl : instanceURL,
            method : 'GET',
            uri : _const.TASK_URI,
            json : true,

            headers: {
                'Cookie': _SESSION_COOKIE
            }

        }, function(err, response, body) {
            if (!err && response.statusCode == 200){
                callBack(err, response, body);
            } else {
                callBack(err, response, body);
            }
        });
    },

    getComments: function(instanceURL, taskID, callBack) {
        log.info("getComments : Start");
        request.debug = false;
        request({
            baseUrl : instanceURL,
            method : 'GET',
            uri : 'api/now/v2/table/sys_journal_field?sysparm_query=element_id%3D' + taskID + '%5EORDERBYDESCsys_created_on',
            json : true,

            headers: {
                'Cookie': _SESSION_COOKIE
            }

        }, function(err, response, body) {
            if (!err && response.statusCode == 200){
                callBack(err, response, body);
            } else {
                callBack(err, response, body);
            }
        });
    }
   
}
