// (C) Copyright 2015-2016 Hewlett Packard Enterprise Development LP
'use strict';
// This module provider the interface to the DB.

// TODO move the pure DB operation from the esPersistence.js to here.
var elasticsearch = require('elasticsearch');
var _ = require( 'lodash' );
var log = require('../common/log');

var esPort = process.env.ES_PORT ? process.env.ES_PORT : '9200';
const MAX_RESULT_WINDOW = 10000;
const MAX_APPLIANCE_COUNT = 20;

var _client = elasticsearch.Client({
  host: 'localhost:' + esPort,
  log: 'info'
});

exports.parseGetResult = parseGetResult;
exports.getResource = getResource;
exports.postResource = postResource;
exports.putResource = putResource;
exports.deleteResource = deleteResource;



/**
 * Get resource by specific field from a category .
 */
exports.searchExactValue = searchExactValue;

/**
 * Get resource by specific field from a category .
 */
exports.findAllByCategory = findAllByCategory;
/**
 * Get resource by specific field from a category matching one or more specified terms .
 */
exports.searchMultiTerms = searchMultiTerms;

/**
 * Delete resources of a specific appliance.
 */
module.exports.deleteResources = deleteResources;

/**
 * Get the client instance of Elasticsearch
 */
exports.getEsClient = getEsClient;


/**
 * Parse the result from GET call of DB. For any error return null.
 */
function parseGetResult(result) {
  try {
    if (result.found !== true) {
      return null;
    }
    return result._source;
  } catch (err) {
    return null;
  }
}

/**
 * Get resource from DB, without callback(error, response) the promise will return.
 *
 */
function getResource(index, type, id, cb) {
  var param = {
    'index': index,
    'type': type,
    'id': id
  };
  return _client.get(param, cb);
}


/**
 * Post resource to DB, without callback(error, response) the promise will return.
 * Note that if the index/type/id already exist, it will fail.
 *
 */
function postResource(index, type, id, resource, cb) {
  var param = {
    'index': index,
    'type': type,
    'id': id,
    'refresh' : true,
    'body': resource
  };
  return _client.create(param, cb);
}

/**
 * Put resource to DB, without callback(error, response) the promise will return.
 * Note that if the index/type/id doesn't exist, it will be created.
 */
function putResource(index, type, id, resource, cb) {
  var param = {
    'index': index,
    'type': type,
    'id': id,
    'refresh' : true,
    'body': resource
  };
  return _client.index(param, cb);
}

/**
 * Delete resource from DB, without callback(error, response) the promise will return.
 *
 */
function deleteResource(index, type, id, cb) {
  var param = {
    'index': index,
    'type': type,
    'id': id,
    'refresh' : true
  };
  return _client.delete(param, cb);
}

/**
 * Delete resources of a specific appliance.
 *
 * @param  {string}   index           index name
 * @param  {string}   type            type name
 * @param  {string or Array}   ids    id list
 * @param  {Function} callback        call after refresh elasticsearch
 * @return {undefined}
 */
function deleteResources(index, type, ids, callback) {
  if (typeof ids === 'string') {
    ids = [ids];
  }
  let buket = ids.map((id) => {
    return {delete: {_index: index, _type: type, _id: id}};
  });

  let params = {
    refresh: true,
    index: index,
    type: type,
    body: buket
  };
  return _client.bulk(params, callback);
}

/**
 * helper method to mapping ES error to OVP error
 */
function _mapping_error( err ) {
  if ( !err )
    return null;
  else if ( !err.message ) {
    return errors.INTERNAL_ERROR;
  }else if ( err.message === 'No Living connections' ) {
    return errors.ES_NO_CONNECTION;
  }else {
    return errors.INTERNAL_ERROR;
  }
}


/**
 * search from a category by specific field.
 * @param  {string} category  index name of category
 * @param  {string} field1    field name
 * @param  {string} value     value of field
 * @param  {Function} callback1
 * @return {undefined}
 */
function searchExactValue(category, field1, value, callback1) {
  //log.info("searchExactValue() : category = %s, field = %s, value = %s", category, field1, value);
  log.debug("searchExactValue() : category = %s, field = %s, value = %s", category, field1, value);
  var data = {
    'index': category.category,
    'body': {
      'query': {
        'match': {
          [field1]: {
            'query': value,
            'operator': 'and'
          }
        }
      }
    }
  };

  _client.search(data, function(err, resp) {
    var result = [];
    if (resp.hits && resp.hits.total > 0) {

      for (var i in resp.hits.hits) {
        var item = resp.hits.hits[i]._source;
        item._id = resp.hits.hits[i]._id;
        result.push(item);
      }
    } else {
      //log.info("searchExactValue(): Nothing found");
      log.info("searchExactValue(): Nothing found");
    }

    callback1(result, err);
  });
}

function findAllByCategory(category, type, callback1) {
  var data = {
    'index': category,
    'type': type,
    'body': {
      'query': {
        'match_all': {}
      }
    }
  };
  _client.search(data, function(err, resp){
    var result = [];
    if (resp.hits && resp.hits.total > 0) {
      for ( var i in resp.hits.hits) {
        var item = resp.hits.hits[i]._source;
        item._id = resp.hits.hits[i]._id;
        result.push(item);
      }
    } else {
      log.error("findAllByCategory(): Nothing found ");
    }
    log.debug('findAllByCategory : result  :', result);
    callback1(result);
  });
}

/**
 * Searches for match with one or more terms listed in 'terms' like "['/rest/global/1234', '/rest/global/5678']"
 * @param {string} index
 * @param {string} field
 * @param {Array} terms {comma separated}
 * @param {Function} callback
 */
function searchMultiTerms(index, field, terms, fields, callback1) {


  // construct JSON as string as both property name and value are variables
  let temp = '{"' + field + '": "" }';

  let query = { 
                'index': index,
                'body': {
                  "_source": fields,
                  "query": {
                    "constant_score": {
                      "filter": {
                        "terms": { [field] : terms }
                      }
                    }
                  }
                }
              };


  log.info("searchMultiTerms: query: ", JSON.stringify(query));

  _client.search(query, function(err, resp){
    log.debug("searchMultiTerms: err: ", err);
    log.debug("searchMultiTerms: resp: ", JSON.stringify(resp));

    if (err) {
      callback1(err);
    } else {
      let result = [];
      _.forEach(resp.hits.hits, function(hit) {

        let item = hit._source;
        //log.debug("item: ", item);
        item['id'] = hit._id;

        result.push(item);
      });

      log.debug("searchMultiTerms: result: ", result);

      callback1(undefined, result);
    }

  });
}


/**
 * Get the client instance of Elasticsearch
 * @param void
 */
function getEsClient() {
  return _client;
}
