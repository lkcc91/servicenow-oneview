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

var _ = require('lodash');
var _const = require('../common/const');
var dbClient = require('../client/persistenceClient');

//Get the client instance of Elasticsearch
var _client = dbClient.getEsClient();

var searchService = {

  /**
   * Generate the query object and return
   *
   * @param  {String} queryString The user input query string
   */
  generateSearchQuery: function(queryString) {
    var result = {};
    if (queryString) {
      /**
      For example:
      If user input "bay 7", current data.body.query.filtered.query is:
      {
        "bool": {
          "should": [
            {
              "match": {
                "_weighFields": {
                  "query": "bay 7",
                  "operator": "or",
                  "analyzer": "whitespace_analyzer"
                }
              }
            },
            {
              "match": {
                "_partialMatchFields": {
                  "query": "bay 7",
                  "operator": "or"
                }
              }
            },
            {
              "match": {
                "_all": {
                  "query": "bay 7",
                  "operator": "or"
                }
              }
            }
          ]
        }
      }

      If user input "\"bay 7\"", current data.body.query.filtered.query is:
      {
        "bool": {
          "should": [
            {
              "match_phrase": {
                "_weighFields": {
                  "query": "bay 7",
                  "operator": "and",
                  "analyzer": "keyword_analyzer_weight"
                }
              }
            },
            {
              "match_phrase": {
                "_partialMatchFields": {
                  "query": "bay 7",
                  "operator": "and"
                }
              }
            },
            {
              "match_phrase": {
                "_all": {
                  "query": "bay 7",
                  "operator": "and"
                }
              }
            }
          ]
        }
      }
      **/
      // To check if the query string start and end with \", Ex. '\"bay 7\"'
      // If true, to use "match_phrase", which is to match query the words near each other
      var queryOperator = 'or'; // By default query with 'or'
      var matchQuery = 'match'; // By default query with 'match'
      var searchAnalyzer = 'whitespace_analyzer'; // By default search with 'whitespace_analyzer'
      if (_.isString(queryString)) {
        if (queryString.startsWith('\"') && queryString.endsWith('\"')) {
          // Modify the match query
          matchQuery = 'match_phrase';
          // Modify the query operator
          queryOperator = 'and';
          // Modify the search analyzer, only used by _weightFields
          searchAnalyzer = 'keyword_analyzer_weight';
          // Remove the start and end '\"'
          queryString = queryString.slice(1, -1);
        }
      }
      // Generate the query
      result.query = {
        'bool': {
          'should': [
            {
              [matchQuery]: {
                '_weightFields': { // Search from _weightFields for name etc. The result will with higher score
                  'query': queryString,
                  'operator': queryOperator,
                  'analyzer': searchAnalyzer,
                  'boost': 3
                }
              }
            },
            {
              [matchQuery]: {
                '_partialMatchFields': { // Search from _partialMatchFields, Ex. uuid, serialNumber etc.
                  'query': queryString,
                  'operator': queryOperator
                  // By default search with 'whitespace_analyzer'
                }
              }
            },
            {
              [matchQuery]: {
                '_all': {
                  'query': queryString,
                  'operator': queryOperator
                  // By default search with 'whitespace_analyzer'
                }
              }
            }
          ]
        }
      };
    }

    return result;
  },

  /**
   * Search function by category
   *
   * @param  {Request} req
   * @param  {Function} callback1 callback after search done.
   */
  searchByCategory: function(req, callback1) {
    var params = req.params;
    // Get total count of items in the specified index
    _client.count({
      'index': params.category
    }, function(error, response) {
      var unfilteredTotal = response.count;
      if (params.count === 'all') {
        params.count = unfilteredTotal;
      }
      var size = params.count || 20;
      var start = params.start || 0;

      var data = {
        'index': params.category,
        'body': {
          'size': size,
          'from': start,
          'query': {
            'filtered': {}
          }
        }
      };

      if (params.query) {
        // Generate the query
        data.body.query.filtered = searchService.generateSearchQuery(params.query);
      }

      if (!_.isEmpty(params.filters)) {
        data.body.query.filtered.filter = {
          'terms': params.filters
        };
      }
      req.log.info({
        unfilteredTotal, data: JSON.stringify(data)
      }, 'search');
      return _client.search(data, function(err, data) {
        callback1(err, data, unfilteredTotal);
      });
    });

  },

  /**
   * Global search function, search all indices
   *
   * @param  {Param} params
   * @param  {Function} callback1 callback after search done.
   */
  searchAll: function(params, callback1) {
    // indices to search
    // Included the user profile index to this list
    var indices = ['appliances', 'enclosures', 'server-hardware', 'server-profiles', _const.CONVERGED_SYSTEMS];

    // Base of search query
    var searchQuery = {
      'index': indices,
      'body': {
        'size': params.count,
        'from': params.start,
        'query': {
          'filtered': {}
        }
      }
    };

    if (params.query) {
      // Generate the query
      searchQuery.body.query.filtered = searchService.generateSearchQuery(params.query);
    } else {
      // Because for searching from all function, if user does not input query string, from UI we would like to see an empty list,
      // so if the input query string is empty, to set the 'query':{}, then it will return 0 result.
      searchQuery.body.query.filtered = {'query':{}};
    }

    // Check if there are any filter terms
    if (!_.isEmpty(params.filters)) {
      // set filter terms
      searchQuery.body.query.filtered.filter = {
        'bool': {
          'must': [{
            'terms': params.filters
          }]
        }
      };
    }

    _client.count({
      'index': indices
    }, function(error, response) {
      var unfilteredTotal = response.count;

      return _client.search(searchQuery, function(err, data) {
        callback1(err, data, unfilteredTotal);
      });
    });
  }

};

module.exports = searchService;
