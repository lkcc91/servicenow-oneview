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

//arrow REST endpoints
var express = require('express');
var app = express();
var routes = require('express').Router();

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var Const = require('./common/const');
var bodyParser  = require('body-parser');
var oneviewClient = require('./client/oneviewClient');
var esPersistence = require('./esPersistence');
var util = require('./common/utils');
var oneviewrest = require('./oneviewrest');
var log = require('./common/log');
var waterfall = require('a-sync-waterfall');

var arrowtoken = '';

var alerts_data = { 
	alertState: "Cleared", 
	assignedToUser: "administrator", 
	alertUrgency:"None", 
	notes:"Problem fixed"
}

// //base API
routes.get('/', function (req, res) {
	log.info(" Welcome to API");
	res.status(200).json({
        "message": 'Welcome - REST API'
    });
	
});

//authenticate and return token
routes.post('/login-sessions', function (req, res) {
	log.info("authenticating user and will return token if successfull");
	log.info('arrowrest: /login-sessions: req.body', req.body);
	esPersistence.findOne('users', 'username', req.body.username, function (user){

		log.debug("in arrow test: return value from findOne: ", user);
		log.debug("in arrow test: return value username: ", user[0].username);
		log.debug("in arrow test: return value password: ", user[0].password);
		if(!user) {
			log.error("arrowrest: Authentication failed");
			res.json({success: false, message: 'Authentication failed, User not found'})
		} 
		else {
			log.debug("User found! ", user[0])

			//check if password matches
			if (user[0].password != req.body.password) {
				log.error("Authentication failed wrong password!")
				res.json({success: false, message: 'Authentication failed, Wrong password'})
			} else {
	
				log.info("Authentication successfull!")

				//if user is found and password is correct
				//then create a token
				var token = jwt.sign(user[0], Const.SECRET, {
					expiresIn: 60*60*24 //expires  in 24 hours
				});
				//TODO: change the global variable to db
				//copy to global variable
				arrowtoken = token
	
				log.debug("Authentication successfull! token: ", arrowtoken);
				log.debug("before retuning token: ", arrowtoken);

				//return the token
				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
				log.debug("Authentication successfull! response sent: " );

			}
		}
	});

});
;

routes.use(function(req, res, next) {
  log.debug("routes.use: req.body: ", req.body);
  var token = req.body.token || req.query.token || req.headers['auth'];
  log.debug(" arrrowrest: req.headers['auth'] : ", req.headers['auth']);
  log.debug(" input token to arrow API : ", token);

  //decode token
  if (token) {

  	//varifies secret
  	jwt.verify(token, Const.SECRET, function(err, decoded){
  		if (err) {
  			return res.json({success: false, message: 'Failed to authenticate token.'});
  		} else {
  			req.decoded = decoded;
  			next();
  		}
  	});
  } else {

  	//if no token passed
  	//return error
  	return res.status(403).send({
  		success: false,
  		message: 'No token provided'
  	})
  }
  
});

routes.get('/login-sessions', function (req, res) {
	
	res.status(200).json({
        token: arrowtoken
    });
	
});

routes.get('/users', function (req, res) {
	
	esPersistence.findAllByCategory('users', 'users', function(users){
		res.json(users);
	});
	
});


//Sever provisioning with image streamer
routes.post('/provision-server', function(req, res) {
	
	log.info("/provision-server: request from SNOW to provision server received");
	var uuid = req.body.uuid;
	var isSuccess;
	var message = ""
	var osName = req.body.osName; //RHEL7-2 or RHEL7.3
	log.debug("/provision-server: ", req.body);

	waterfall([
		function searchUuidValue(searchUuidCallback){
			esPersistence.findOne('server-hardware', 'uuid', uuid, function(server){
				if (server) {
					log.debug("server record from ES for uuid: ", server[0]);
					console.log("server record from ES for uuid: ", server[0])
					//form the POST request body
					var body = util.formRequestBody(server[0], "with_i3s", osName);
					body.name = server[0].name // Profile name
					//get the sessionId using IP address
					var ovAddress = server[0].ovAddress;
					searchUuidCallback(null, body, ovAddress);
				} else {
					isSuccess = false;
					message = " ERROR: server uuid record not found";
					log.error ("server record not found having uuid: ", uuid);
					res.json({
						success: isSuccess,
						message: message
					});
					searchUuidCallback(null, null, null);
				}
			});

		},
		function searchAddressValue(body, ovAddress, searchAddressCallback) {
			esPersistence.findOne('appliances', 'ovaddress', ovAddress, function( result){
				var sessionId = "";
				if (result) {
					log.debug("session id of ov appliance address: ", result[0].ovSessionId);
					sessionId = result[0].ovSessionId;
					searchAddressCallback(null, body, ovAddress, sessionId);
				} else {
					isSuccess = false;
					message = " ERROR: appliance record with ovAddress not found";
					log.error ("record not found having ov address: ", ovAddress);
					res.json({
						success: isSuccess,
						message: message
					});
					searchAddressCallback(null, null, null);
				}
			});
		},

		function createServerProfile(body, ovAddress, sessionId, createServerProfileCallback) {
			oneviewrest.createServerProfile(ovAddress, sessionId, body, function(host, err, response){
				if (err == null) {
					res.json({
						success: false,
						message: "ERROR: Create server profile failed, please check the post task uri"
					});
					createServerProfileCallback(null, null);
				} else  {
					isSuccess = true;
				 	message = response;
				 	res.json({
						success: isSuccess,
						message: message
					});
					log.info ("response from oneview after server profile create : ", response);
					//TODO : get the task uri and check for the error
					createServerProfileCallback(null, 'done');
				}
			});
		}

		], function(err, result) {
			if ( result == 'done') {
				log.info (" Provision of server is in progress...check the status on oneview ui");
			}
	});	
});

/*
//server provisioning for c7000 based blade or synergy blade (without image streamer)
routes.post('/provision-server', function(req, res) {
	
	log.info("/provision-server: request from SNOW to provision server received");
	var uuid = req.body.uuid;
	var isSuccess;
	var message = ""

	waterfall([
		function searchUuidValue(searchUuidCallback){
			esPersistence.findOne('server-hardware', 'uuid', uuid, function(server){
				if (server) {
					log.debug("server record from ES for uuid: ", server[0]);
					console.log("server record from ES for uuid: ", server[0])
					//form the POST request body
					var body = util.formRequestBody(server[0], null, null);
					body.name = server[0].name // Profile name
					//get the sessionId using IP address
					var ovAddress = server[0].ovAddress;
					searchUuidCallback(null, body, ovAddress);
				} else {
					isSuccess = false;
					message = " ERROR: server uuid record not found";
					log.error ("server record not found having uuid: ", uuid);
					res.json({
						success: isSuccess,
						message: message
					});
					searchUuidCallback(null, null, null);
				}
			});

		},
		function searchAddressValue(body, ovAddress, searchAddressCallback) {
			esPersistence.findOne('appliances', 'ovaddress', ovAddress, function( result){
				var sessionId = "";
				if (result) {
					log.debug("session id of ov appliance address: ", result[0].ovSessionId);
					sessionId = result[0].ovSessionId;
					searchAddressCallback(null, body, ovAddress, sessionId);
				} else {
					isSuccess = false;
					message = " ERROR: appliance record with ovAddress not found";
					log.error ("record not found having ov address: ", ovAddress);
					res.json({
						success: isSuccess,
						message: message
					});
					searchAddressCallback(null, null, null);
				}
			});
		},

		function createServerProfile(body, ovAddress, sessionId, createServerProfileCallback) {
			oneviewrest.createServerProfile(ovAddress, sessionId, body, function(host, err, response){
				if (err == null) {
					res.json({
						success: false,
						message: "ERROR: Create server profile failed, please check the post task uri"
					});
					createServerProfileCallback(null, null);
				} else  {
					isSuccess = true;
				 	message = response;
				 	res.json({
						success: isSuccess,
						message: message
					});
					log.info ("response from oneview after server profile create : ", response);
					//TODO : get the task uri and check for the error
					createServerProfileCallback(null, 'done');
				}
			});
		}

		], function(err, result) {
			if ( result == 'done') {
				log.info (" Provision of server is in progress...check the status on oneview ui");
			}
	});	
});

*/

routes.post('/incident', function(req, res) {
	
	log.info("POST /incident: request from SNOW to clear alerts in OV is received");
	console.log("POST /incident: request from SNOW to clear alerts in OV is received");	

	var ovAddress = "";
	var alertId = "";

	// The response paramater alerturi containers alertURI concatenated with OV Address
	// like "/rest/alert/1234-10.10.20.201"

	log.debug("POST /incident: body.alerturi: ", req.body.alerturi);
	console.log("POST /incident: body.alerturi: ", req.body.alerturi);
	var strlist = req.body.alerturi.split("-");
	log.debug("POST /incident: strlist length : ", strlist.length);
	log.debug("POST /incident: strlist[0] : ", strlist[0]);
	log.debug("POST /incident: strlist[1] : ", strlist[1]);

	if(strlist.length == 2) {
		ovAddress = strlist[1];
	}

	alertId = strlist[0];
	
	var ovSessionId = ""
	log.debug("POST /incident: alertId: ", alertId);
	esPersistence.findOne('appliances', 'ovaddress', ovAddress, function(result, err){
		if (result) {
			ovSessionId = result[0].ovSessionId;
			oneviewrest.updateAlert(ovAddress, alertId, ovSessionId, alerts_data, function(host, response){
				log.debug('POST /incident: response from alerts PUT request:', response);

				if(response == null) {
					log.error('POST /incident: ERROR: UpdateAlert call returned error with message: ', response);
					res.json({
						success: false,
						message: 'ERROR: Failed to update the Alert in OneView appliance. Please refer to Arrow logs for more details'
					});
				}else {
					res.json({
						success: true,
						message: 'request for clearing alerts received and it is in progress...'
					});
					log.debug('POST /incident: Updating alert on oneview');
				}
			});
		} else {
			log.error("POST /incident: ERROR: Error fetching OneView data from ES. The error is: ", err);
			res.json({
				success: false,
				message: 'ERROR: Failed to update the Alert in OneView appliance. Please refer to Arrow logs for more details'
			});
		}
	});	
});

module.exports = routes;