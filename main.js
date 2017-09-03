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
var snowClient = require('./client/snowClient');
var arrowrest = require('./arrowrest');
var ovrest = require('./oneviewrest');
var esPersistence = require('./esPersistence');
var snow = require('./arguments.json');
var log = require('./common/log');

var servicenow_instance_url = "https://"+snow.servicenow.instance+"."+"service-now.com"

var Main = {
	
	// Initial server initialization for estatblishig all integration connections
	init: function(callback1) {
			
		//init oneview
		Main.ovinit();

		//init es persistence
		Main.esInit();

		log.info ("Ging to login to snow instance : ",servicenow_instance_url);

		snowClient.snowLogin(servicenow_instance_url, snow.servicenow.username, snow.servicenow.password, function(err, response, body){
			if (err) {
				log.error("snowLogin: err: ", err);	
				callback1(err);
			} else {
				log.info("snowLogin: successful");
				callback1();
			}			
		});

	},
	getHardwareModel: function() {
		snowClient.getHardwareModel(servicenow_instance_url, function(err, response, body) {
			log.info("getHardwareModel: response: ", JSON.stringify(body));			
		});
	},
	addHardwareModel: function() {
		snowClient.addHardwareModel(servicenow_instance_url, function(err, response, body) {
			log.info("addHardwareModel: response: ", JSON.stringify(body));
		});
	},
	getTasks: function() {
		snowClient.getTasks(servicenow_instance_url, function(err, response, body) {
			log.info("getTasks: body: ", JSON.stringify(body));
		});
	},
	getComments: function(taskID) {
		snowClient.getComments(servicenow_instance_url, taskID, function(err, response, body) {
			log.info("getComments: response: ", JSON.stringify(body));
		});
	},

	ovinit: function() {
		ovrest.init();
	},

	esInit: function()  {
		esPersistence.initPersistence();
	}
}

module.exports = Main;