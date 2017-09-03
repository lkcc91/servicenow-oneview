// (C) Copyright 2016 Hewlett Packard Enterprise Development LP
'use strict';

var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var esArrowIndicesConfig = require('./common/esArrowIndicesConfig');
var creds = require('./arguments.json');
var persistenceClient = require('./client/persistenceClient');
var log = require('./common/log');
var Const = require('./common/const');

// Global variable to store appliance data loading progress
var progress = {};
var ARROW_ADMIN_ROLE = Const.ARROW_ADMIN_ROLE;

//temp OS deployment data
var os_deployment_plans = {
  "osname": "",
  "osDeploymentPlanUri": "",
  "ovAddress": ""
}


var esPort = process.env.ES_PORT ? process.env.ES_PORT : '9200';
var _client = elasticsearch.Client({
  host: 'localhost:' + esPort,
  log: 'info'
});

var oneviewIndices = esArrowIndicesConfig.oneviewIndices;
var applianceIndex = esArrowIndicesConfig.applianceIndex;
var defaultAnalysis = esArrowIndicesConfig.defaultAnalysis;

// set default analysis for each Oneview index
_.forEach(oneviewIndices, function(indexJSON) {
  indexJSON.body.settings.analysis = defaultAnalysis;
});


function initIndices(callback) {
  log.debug("esPersistence: initIndices: start");
  let allIndices = _.assign({}, oneviewIndices, applianceIndex);
  let promises = _.map(allIndices, (indexSetting) => {
    log.debug("esPersistence: initIndices: indexSetting: ", indexSetting.index);

    return _client.indices.exists({
      index: indexSetting.index
    }).then((exists) => {
      if (!exists) {
        return _client.indices.create(indexSetting);
      } 
      return undefined;
    });
  });


  Promise.all(promises).then((result) => {
    log.debug("esPersistence: initIndices:  then condition result:", result);
    // _client.indices.refresh({
    //   index: _.map(allIndices, indexSetting => indexSetting.index)
    // }, callback(null));
    log.debug("esPersistence: initIndices: before calling callback");
    callback(null);
  }).catch((err) => {
    log.error("esPersistence: then condition err:", err);
    log.error('esPersistence: failed to create indices', err);
    callback(err);
  });
  log.error("esPersistence : before returning initIndices");
}
 
var esPersistence = {

  initPersistence: function() {
 
    initIndices((err) => {
      if (err) {
        log.error("ERROR: esPersistence: initPersistence : failed to create indices:", err);
      }
      log.debug("esPersistence: initPersistence : before creating user index");
      //insert users
      _client.index({
        index:'users',
        type: 'users',
        id: '1',
        body:{
          username: creds.arrow.username,
          password: creds.arrow.password,
          admin: ARROW_ADMIN_ROLE
        }, function (err, resp) {
          //log.debug("response: ", response);
        }
      });
    });
  },

  findOne: function(category, field, value, cb) {
    persistenceClient.searchExactValue(category, field, value, function(result, err){
      if (result != "undefined" &&  result.length > 0) {
        cb(result);
      } else {
        cb(null, err);
      }
    });
  },

  findSessionId: function(category, field, value, cb) {
    persistenceClient.searchExactValue(category, field, value, function(result){
      log.debug(" esPersistence: findSessionId : result: ", result);
      if (result != "undefined" &&  result.length > 0) {
        cb(result);
      } else {
        cb(null);
      }
    });
  },

  findAllByCategory: function(category, type, cb) {
    persistenceClient.findAllByCategory(category, category, cb);
  },

  saveServerHardwareData: function(ovAddress, category, type, data, cb) {
    
    let bulkitems = [];

    for (var i in data) {
      let index = {
        "_index":category,
        "_type": type,
        "_id": data[i].uuid
      }
      data[i].ovAddress = ovAddress;
      bulkitems.push(index);
      bulkitems.push(data[i]);
      //TODO bulk operation
      persistenceClient.postResource ('server-hardware', 'server-hardware', data[i].uuid, data[i], function(err, response){
        if (err) {
          log.error("saveServerHardwareData: error from postResource: ", err);  
        }
        
      });
    }
    //TODO: try for bulk load in the next version
    // var bulkdata = {
    //   "body": bulkitems
    // }
    // _client.bulk(bulkdata, function(err, resp){
    //   cb(err, resp);
    // });
    
  },

  saveServerProfileData: function(category, type, id, data, cb) {
    persistenceClient.postResource (category, type, id, data, cb);
  },

  saveIncidentsData: function(category, type, id, data, cb) {
    persistenceClient.postResource (category, type, id, data, cb);
  },

  saveOVApplianceData: function(category, type, id, data, cb) {
    //convert 10.10.10.10 to 10_10_10_10 format to store as id of record
    var new_id = id.replace(/\./g, '_');
    persistenceClient.postResource (category, type, new_id, data, function (resp){
      if (resp) {
        cb(resp);
      } else {
        cb(null);
      }
    });
  },

  saveDeploymentPlansData: function(ovAddress, category, type,  data ,cb) {
    let bulkitems = [];

    for (var i in data) {
      let index = {
        "_index":category,
        "_type": type,
        "_id": data[i].uuid
      }
      data[i].ovAddress = ovAddress;
      bulkitems.push(index);
      bulkitems.push(data[i]);
      //TODO bulk operation
      persistenceClient.postResource ('os-deployment-plans', 'os-deployment-plans', data[i].id, data[i], function(err, response){
        if (err) {
          log.error("saveDeploymentPlansData: error from postResource in saveDeploymentPlansData: ", err);  
        }
        
      });
    }
    //TODO: try for bulk load in the next version    
  },

  saveDeploymentServersData: function(ovAddress, category, type, data, cb) {
    let bulkitems = [];

    for (var i in data) {
      let index = {
        "_index":category,
        "_type": type,
        "_id": data[i].uuid
      }
      data[i].ovAddress = ovAddress;
      bulkitems.push(index);
      bulkitems.push(data[i]);
      //TODO bulk operation
      persistenceClient.postResource ('os-deployment-servers', 'os-deployment-servers', data[i].id, data[i], function(err, response){
        if (err) {
          log.error("saveDeploymentServersData: error from postResource: ", err);  
        }        
      });
    }
    //TODO: try for bulk load in the next version   
  },
  
  saveNetworksData: function(ovAddress, category, type, data, cb) {
    let bulkitems = [];

    for (var i in data) {
      let index = {
        "_index":category,
        "_type": type,
        "_id": data[i].uri
      }
      data[i].ovAddress = ovAddress;
      bulkitems.push(index);
      bulkitems.push(data[i]);
      //TODO bulk operation
      persistenceClient.postResource ('networks', 'networks', data[i].id, data[i], function(err, response){
        if (err) {
          log.error("saveNetworksData: error from postResource: ", err);  
        }
        
      });
    }
    //TODO: try for bulk load in the next version   
  }
};

module.exports = esPersistence;
