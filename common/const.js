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

// Define various constant value here.

var REST_BASE_URI = '/rest/global';
var SNOW_BASE_URI = '/api';


module.exports = {
  REST_BASE_URI,
  LOGIN_URI : REST_BASE_URI + '/login-sessions',
  LOGOUT_URI : REST_BASE_URI + '/logout',
  APPLIANCES_URI : REST_BASE_URI + '/appliances',
  INDEX_RESOURCES_URI : REST_BASE_URI + '/index/resources',
  INDEX_AGGREGATED_RESOURCES_URI : REST_BASE_URI + '/index/resources/aggregated',

  //SNOW specific URIs
  TASK_URI : SNOW_BASE_URI + '/now/v2/table/task',
  SNOW_LOGIN_URI : SNOW_BASE_URI + '/now/v2/table/sys_user?sysparm_query=user_name%3D',
  CMDB_HARDWARE_PRODUCT_MODEL : SNOW_BASE_URI + '/now/table/cmdb_hardware_product_model',

  //Default API-Version to request ov
  DEFAULT_API_VERSION : 300,
  COMPONENT_NAME : 'arrow',
  LOCALHOST : 'localhost',
  LOGIN_DOMAIN_LOCAL : 'local',

  SECRET: 'thisisprakashsecret',
  ARROW_ADMIN_ROLE : true,

  appliance : {
    db_index : "appliances",
    db_type : "appliance",
    ws_category : "appliances",
    scmb_category : "appliances"
  },

  server_hardware : {
    db_index : "server-hardware",
    db_type : "server-hardware",
    ws_category : "server-hardware",
    scmb_category : "server-hardware"
  },

  server_profile : {
    db_index : "server-profiles",
    db_type : "server-profile",
    ws_category : "server-profiles",
    scmb_category : "server-profiles"
  },

  enclosure : {
    db_index : "enclosures",
    db_type : "enclosure",
    ws_category : "enclosures",
    scmb_category : "enclosures"
  },

  alert : {
    db_index : "alerts",
    db_type : "alerts",
    ws_category : "alerts",
    scmb_category : "alerts"
  },

  user_profile : {
    db_index : "user-profiles",
    db_type : "user-profile",
    ws_category : "user-profiles",
    scmb_category : ""
  }

};
