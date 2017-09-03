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
'use strict';

//var creds = require('./creds');
var creds = require('./arguments.json')
var Const = require('./common/const');
var _ = require('lodash');
var esPersistence = require('./esPersistence');
var oneviewClient = require('./client/oneviewClient');
var log = require('./common/log');

//TODO: temp global variable to store OV session ID
var ovSessionId = '';
var ovVersion = "3.0";
var authLoginDomain ="LOCAL";
var loginMsgAck = null;


var OneView = {

	init: function() {
  	//TODO : temp place with hardcoded data
	  	var data = {
	  		userName:creds.oneview.user,
	  		password:creds.oneview.passwd,
	  		authLoginDomain:authLoginDomain,
	  		loginMsgAck:loginMsgAck
	  	}
	  	log.debug("Going to connect oneview instance : ", creds.oneview.host);
	  	//TODO : convert to promise
	  	OneView.connectAppliance(creds.oneview.host, data, function(err, response){
	  		//log.debug("response from oneview connectAppliance : ", response);
	  		if (response == null) {
	  			log.error("OneView : connectAppliance : response null");
	  			return;
	  		}
	  		ovSessionId = response.sessionID;
	  		log.debug('sessionID from OV :', ovSessionId);
	  		//load appliance sessionID and IP address in ES
	  		var storeData = {
	  			'ovaddress': creds.oneview.host,
	  			'ovSessionId': ovSessionId,
	  			'ovVersion': ovVersion
	  		}
	  		esPersistence.saveOVApplianceData('appliances', 'appliance', creds.oneview.host, storeData, function (resp){
	  			log.debug("after saveOVApplianceData : ", resp);
	  		})
	  		//load server hardware details into Elastic search	  		
		  	OneView.getServerHardware(creds.oneview.host, ovSessionId, function(err, response){
		  		if (err == null) {
		  			log.error('ERROR: from esPersistence.getServerHardware');
		  		} else {
		  			esPersistence.saveServerHardwareData(creds.oneview.host, 'server-hardware', 'server-hardware', response.members, function(err, response){
			  			if (err) {
			  				log.error('ERROR: from esPersistence.saveServerHardwareData : ', err);
			  			}		  			
		  			});	
		  		}		  		
		  	});
		  	// OneView.getServerHardware(creds.ovaddress, ovSessionId, function(err, response){
		  	// 	if (!err) {
		  	// 		console.log(" OV server-hardware data: ", response);	
		  	// 	} else {
		  	// 		console.log(" OV server-hardware data: ", response.members);
			  // 		esPersistence.saveServerHardwareData(creds.ovaddress, 'server-hardware', 'server-hardware', response.members, function(err, response){
			  // 			if (err) {
			  // 				console.log('ERROR: from esPersistence.saveServerHardwareData : ', err);	
			  // 			}		  			
			  // 		});	
		  	// 	}		  		
		  	// });

		  	//get deployment network details from OV and save it into ES
		  	// OneView.getNetworks(creds.ovaddress, ovSessionId, function(err, response){
		  	// 	if (!err) {
		  	// 		esPersistence.saveNetworksData(creds.ovaddress, 'networks', 'networks', response.members, function(err, response){
			  // 			if (err) {
			  // 				console.log('ERROR:  from esPersistence.saveNetworksData : ', err);	
			  // 			}		  			
			  // 		});
		  	// 	} else {
		  	// 		console.log("ERROR: getting networks from oneview");
		  	// 	}
		  	// });

		  	//Uncomment if image streamer is connected to Synergy
		  	//load OS deployment details
		  	// OneView.getOsDeploymentServers(creds.ovaddress, ovSessionId, function(response){
		  	// 	//log.info("getOsDeploymentServers : ", response.members);
		  	// 	//get the deployment server IP address
		  	// 	var deploymentServerIP = response.members[0].primaryIPV4;
		  	// 	//store into ES
		  	// 	esPersistence.saveDeploymentServersData(creds.ovaddress, 'os-deployment-servers', 'os-deployment-servers',  response.members, function(err, response) {
			  // 		//log.info(" response after saving deployment-servers : ", response);
			  // 		if (err) {
			  // 			log.error("error from esPersistence.saveDeploymentServersData:", err);
			  // 		}
			  // 	});

			  // 	//get OS deployment plans
			  // 	OneView.getOsDeploymentPlans(deploymentServerIP, ovSessionId, function(response){
			  // 		//save deployment plans			  		
			  // 		esPersistence.saveDeploymentPlansData(creds.ovaddress, 'os-deployment-plans', 'os-deployment-plans', response.members, function(err, response) {
				 //  		if (err) {
				 //  			log.error("error from esPersistence.saveImageStreamerData:", err);
				 //  		}		  		
				 //  	});
			  // 	});
		  	// });
		  	
	  	});
	},	

	//login to OV and get the sessionID
	//endpoint : /rest/login-sessions
	connectAppliance: function(ipAddress, data, callback1) {
		// login to this appliance
		oneviewClient.performPostRequest(ipAddress, '/rest/login-sessions', undefined, data, callback1);
	},

	//get server-hardware data
	getServerHardware: function(ipAddress, sessionId, callback1) {
		oneviewClient.performGetRequest(ipAddress, '/rest/server-hardware', 'GET', sessionId, callback1);
	},

	//get os deployment plans data
	getOsDeploymentPlans: function(ipAddress, sessionId, callback1) {
		oneviewClient.performGetRequest(ipAddress, '/rest/deployment-plans', 'GET', sessionId, callback1);
	},

	//get os deployment server data
	getOsDeploymentServers: function(ipAddress, sessionId, callback1) {
		oneviewClient.performGetRequest(ipAddress, '/rest/deployment-servers', 'GET', sessionId, callback1);
	},

	createServerProfile: function(ovAddress, sessionId, body, callback1) {
		oneviewClient.performPostRequest(ovAddress, '/rest/server-profiles', sessionId, body, callback1);
	},
	getNetworks: function(ovAddress, sessionId, body, callback1) {
		oneviewClient.performGetRequest(ovAddress, '/rest/ethernet-networks', 'GET', sessionId, callback1);
	},
	//alertUri has the full uri like /rest/alerts/1234
	updateAlert: function(ovAddress, alertUri, sessionId, body, callback1) {
		oneviewClient.performPutRequest(ovAddress, alertUri, sessionId, body, callback1);

	}

};
module.exports = OneView;