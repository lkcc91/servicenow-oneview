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

var _const = require('./const');

var oneviewIndices = {
   'server-hardware': {
    'index': 'server-hardware',
    'type': 'server-hardware',
    'id': 'server-hardwares',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server-hardware': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'properties': {
            'name': { // Copy to '_weightFields'
              'type': 'string',
              'copy_to':  '_weightFields',
              'include_in_all': false
            },
            'powerState': { // Copy to '_weightFields', Ex. 'On','Off'
              'type': 'string',
              'copy_to':  '_weightFields',
              'include_in_all': false
            },
            '_weightFields': { //In order to search in _weightFields with higher score result
              'type': 'string',
              'analyzer': 'ngram_analyzer_weight',
              'search_analyzer': 'keyword_analyzer_weight'
            },
            'applianceLocation': { // Copy to '_partialMatchFields'
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'serialNumber': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'uuid': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'virtualUuid': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'mpDnsName': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'mpIpAddress': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            '_partialMatchFields': { //In order to search in _partialMatchFields by partial matching
              'type': 'string',
              'analyzer': 'ngram_analyzer',
              'search_analyzer': 'whitespace_analyzer'
            },
            'uri': {
              'type': 'string',
              'include_in_all': false
            },
            'originalUri': {
              'type': 'string',
              'include_in_all': false
            },
            'serverProfileUri': {
              'type': 'string',
              'include_in_all': false
            },
            'locationUri': {
              'type': 'string',
              'include_in_all': false
            },
            'appluri': {
              'type': 'string',
              'include_in_all': false
            },
            'model': {
              'type': 'multi_field',
              'fields': {
                'model': {
                  'type': 'string',
                  'copy_to':  '_weightFields',// Copy to '_weightFields'
                  'include_in_all': false
                },
                'raw': {
                  'type': 'string',
                  'index': 'not_analyzed'
                }
              }
            }
          }
        }
      }
    }
  },
  'server-profiles': {
    'index': 'server-profiles',
    'type': 'server-profile',
    'id': 'server-profiles',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server-profile': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'properties': {
            'name': { // Copy to '_weightFields'
              'type': 'string',
              'copy_to':  '_weightFields',
              'include_in_all': false
            },
            '_weightFields': { //In order to search in _weightFields with higher score result
              'type': 'string',
              'analyzer': 'ngram_analyzer_weight',
              'search_analyzer': 'keyword_analyzer_weight'
            },
            'applianceLocation': { // Copy to '_partialMatchFields'
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'serialNumber': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            'uuid': {
              'type': 'string',
              'copy_to':  '_partialMatchFields',
              'include_in_all': false
            },
            '_partialMatchFields': { //In order to search in _partialMatchFields by partial matching
              'type': 'string',
              'analyzer': 'ngram_analyzer',
              'search_analyzer': 'whitespace_analyzer'
            },
            'uri': {
              'type': 'string',
              'include_in_all': false
            },
            'originalUri': {
              'type': 'string',
              'include_in_all': false
            },
            'serverHardwareUri': {
              'type': 'string',
              'include_in_all': false
            },
            'enclosureUri': {
              'type': 'string',
              'include_in_all': false
            },
            'appluri': {
              'type': 'string',
              'include_in_all': false
            }
          }
        }
      }
    }
  },
  'server-profile-templates': {
    'index': 'server-profile-templates',
    'type': 'server-profile-template',
    'id': 'server-profile-templates',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server-profile-template': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'properties': {
            'uri': {
              'type': 'string',
              'include_in_all': false
            },
            'originalUri': {
              'type': 'string',
              'include_in_all': false
            },
            'appluri': {
              'type': 'string',
              'include_in_all': false
            }
          }
        }
      }
    }
  },
   'os-deployment-plans': {
    'index': 'os-deployment-plans',
    'type': 'os-deployment-plans',
    'id': 'os-deployment-plans',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server-profile-template': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'properties': {
            'uri': {
              'type': 'string',
              'include_in_all': false
            },
            'originalUri': {
              'type': 'string',
              'include_in_all': false
            },
            'appluri': {
              'type': 'string',
              'include_in_all': false
            }
          }
        }
      }
    }
  },
   'os-deployment-servers': {
    'index': 'os-deployment-servers',
    'type': 'os-deployment-servers',
    'id': 'os-deployment-servers',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server-profile-template': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'properties': {
            'uri': {
              'type': 'string',
              'include_in_all': false
            },
            'originalUri': {
              'type': 'string',
              'include_in_all': false
            },
            'appluri': {
              'type': 'string',
              'include_in_all': false
            }
          }
        }
      }
    }
  },
  'alerts': {
    'index': 'alerts',
    'type': 'alerts',
    'id': 'alerts',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      }
    }
  },
  'snow_instances': {
    'index': 'snow-instances',
    'type': 'snow-instances',
    'id': 'snow-instances',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      }
    }
  },
  'incidents': {
    'index': 'incidents',
    'type': 'incidents',
    'id': 'incidents',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      }
    }
  },
  'tasks': {
    'index': 'tasks',
    'type': 'tasks',
    'id': 'tasks',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      }
    }
  },
  'networks': {
    'index': 'networks',
    'type': 'networks',
    'id': 'networks',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      }
    }
  }
};

var applianceIndex = {
  'appliances':{
  'index': 'appliances',
  'type': 'appliance',
  'id': 'appliances',
  'body': {
    'settings': {
      'number_of_shards': 1,
      'number_of_replicas': 1,
      'analysis': {
        'filter': {
          'edgengram_filter': { // By default index filter
            'type': 'edge_ngram',
            'min_gram': 1,
            'max_gram': 25,
            'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
          },
          'ngram_filter': { // Add 'ngram_filter', this will allow to search text in the middle of the word, Ex. '201124GR', the part of the S/N '2M201124GR'
            'type': 'ngram',
            'min_gram': 1,
            'max_gram': 40, // In order to search longer host name, uuid, Ex. 'ci-005056b44e75.vse.rdlabs.hpecorp.net','30373737-3237-4D32-3230-313531364752'
            'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
          },
          'truncate_filter_weight': {
            'type': 'truncate',
            'length': 40 // Truncate the token if longer than the length, to avoid the case of cannot find the host name longer than 40
          }
        },
        'analyzer': {
          'edgengram_analyzer': {
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'edgengram_filter'] //Modified by change back to 'edgengram_filter' from 'ngram_filter
          },
          'whitespace_analyzer': {
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'asciifolding'] //Remove 'ngram_filter', in order to search the full text by user typing
          },
          'ngram_analyzer': { //This is used to index the _partialMatchFields, to support partial match
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'ngram_filter']
          },
          'ngram_analyzer_weight': {
            'type': 'custom',
            'tokenizer': 'keyword', //This is used to index the _weightFields field, especially to index the token include whitespace, Ex. "bay 7"
            'filter': ['lowercase', 'ngram_filter']
          },
          'keyword_analyzer_weight': { // This is used to search in _weightFields while user input query string start and end with \"
            'type': 'custom',
            'tokenizer': 'keyword',// 'keyword' tokenizer emits the entire input as a single output
            'filter': ['lowercase', 'asciifolding', 'truncate_filter_weight']
          }
        }
      }
    },
    'mappings': {
      'appliance': {
        '_all': {
          'analyzer': 'edgengram_analyzer',
          'search_analyzer': 'whitespace_analyzer'
        },
        'properties': {
          'name': { // Copy to '_weightFields'
            'type': 'string',
            'copy_to':  '_weightFields',
            'include_in_all': false
          },
          'hostname': {
            'type': 'string',
            'copy_to':  '_weightFields',
            'include_in_all': false
          },
          '_weightFields': { //In order to search in _weightFields with higher score result
            'type': 'string',
            'analyzer': 'ngram_analyzer_weight',
            'search_analyzer': 'keyword_analyzer_weight'
          },
          'applianceLocation': { // Copy to '_partialMatchFields'
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          'version': {
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          'username': {
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          '_partialMatchFields': { //In order to search in _partialMatchFields by partial matching
            'type': 'string',
            'analyzer': 'ngram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'uri': {
            'type': 'string',
            'include_in_all': false
          },
          'caBase64Data': {
            'type': 'string',
            'include_in_all': false
          }

        }
      }
    }
  }
},
'arrow-instance':{
  'index': 'arrow-instance',
  'type': 'arrow-instance',
  'id': 'arrow-instance',
  'body': {
    'settings': {
      'number_of_shards': 1,
      'number_of_replicas': 1,
      'analysis': {
        'filter': {
          'edgengram_filter': { // By default index filter
            'type': 'edge_ngram',
            'min_gram': 1,
            'max_gram': 25,
            'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
          },
          'ngram_filter': { // Add 'ngram_filter', this will allow to search text in the middle of the word, Ex. '201124GR', the part of the S/N '2M201124GR'
            'type': 'ngram',
            'min_gram': 1,
            'max_gram': 40, // In order to search longer host name, uuid, Ex. 'ci-005056b44e75.vse.rdlabs.hpecorp.net','30373737-3237-4D32-3230-313531364752'
            'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
          },
          'truncate_filter_weight': {
            'type': 'truncate',
            'length': 40 // Truncate the token if longer than the length, to avoid the case of cannot find the host name longer than 40
          }
        },
        'analyzer': {
          'edgengram_analyzer': {
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'edgengram_filter'] //Modified by change back to 'edgengram_filter' from 'ngram_filter
          },
          'whitespace_analyzer': {
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'asciifolding'] //Remove 'ngram_filter', in order to search the full text by user typing
          },
          'ngram_analyzer': { //This is used to index the _partialMatchFields, to support partial match
            'type': 'custom',
            'tokenizer': 'whitespace',
            'filter': ['lowercase', 'ngram_filter']
          },
          'ngram_analyzer_weight': {
            'type': 'custom',
            'tokenizer': 'keyword', //This is used to index the _weightFields field, especially to index the token include whitespace, Ex. "bay 7"
            'filter': ['lowercase', 'ngram_filter']
          },
          'keyword_analyzer_weight': { // This is used to search in _weightFields while user input query string start and end with \"
            'type': 'custom',
            'tokenizer': 'keyword',// 'keyword' tokenizer emits the entire input as a single output
            'filter': ['lowercase', 'asciifolding', 'truncate_filter_weight']
          }
        }
      }
    },
    'mappings': {
      'appliance': {
        '_all': {
          'analyzer': 'edgengram_analyzer',
          'search_analyzer': 'whitespace_analyzer'
        },
        'properties': {
          'name': { // Copy to '_weightFields'
            'type': 'string',
            'copy_to':  '_weightFields',
            'include_in_all': false
          },
          'hostname': {
            'type': 'string',
            'copy_to':  '_weightFields',
            'include_in_all': false
          },
          '_weightFields': { //In order to search in _weightFields with higher score result
            'type': 'string',
            'analyzer': 'ngram_analyzer_weight',
            'search_analyzer': 'keyword_analyzer_weight'
          },
          'applianceLocation': { // Copy to '_partialMatchFields'
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          'version': {
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          'username': {
            'type': 'string',
            'copy_to':  '_partialMatchFields',
            'include_in_all': false
          },
          '_partialMatchFields': { //In order to search in _partialMatchFields by partial matching
            'type': 'string',
            'analyzer': 'ngram_analyzer',
            'search_analyzer': 'whitespace_analyzer'
          },
          'uri': {
            'type': 'string',
            'include_in_all': false
          },
          'caBase64Data': {
            'type': 'string',
            'include_in_all': false
          }

        }
      }
    }
  }
}
};

var defaultAnalysis = {
  'filter': {
    'edgengram_filter': {
      'type': 'edge_ngram',
      'min_gram': 1,
      'max_gram': 25,
      'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
    },
    'ngram_filter': { // Add 'ngram_filter', this will allow to search text in the middle of the word, Ex. '201124GR', the part of the S/N '2M201124GR'
      'type': 'ngram',
      'min_gram': 1,
      'max_gram': 40, // In order to search longer host name, uuid, Ex. 'ci-005056b44e75.vse.rdlabs.hpecorp.net','30373737-3237-4D32-3230-313531364752'
      'token_chars': ['letter', 'digit', 'punctuation', 'symbol']
    },
    'truncate_filter_weight': {
      'type': 'truncate',
      'length': 40 //Truncate the token if longer than the length, to avoid the case of cannot find the host name longer than 40
    }
  },
  'analyzer': {
    'edgengram_analyzer': {
      'type': 'custom',
      'tokenizer': 'whitespace',
      'filter': ['lowercase', 'edgengram_filter'] //Modified by change back to 'edgengram_filter' from 'ngram_filter
    },
    'whitespace_analyzer': {
      'type': 'custom',
      'tokenizer': 'whitespace',
      'filter': ['lowercase', 'asciifolding']
    },
    'ngram_analyzer': { //This is used to index the _partialMatchFields, to support partial match
      'type': 'custom',
      'tokenizer': 'whitespace',
      'filter': ['lowercase', 'ngram_filter']
    },
    'ngram_analyzer_weight': {
      'type': 'custom',
      'tokenizer': 'keyword', //This is used to index the _weightFields field, especially to index the token include whitespace, Ex. "bay 7"
      'filter': ['lowercase', 'ngram_filter']
    },
    'keyword_analyzer_weight': { // This is used to search in _weightFields while user input query string start and end with \"
      'type': 'custom',
      'tokenizer': 'keyword',// 'keyword' tokenizer emits the entire input as a single output
      'filter': ['lowercase', 'asciifolding', 'truncate_filter_weight']
    }
  }
};
exports.oneviewIndices = oneviewIndices;
exports.applianceIndex = applianceIndex;
exports.defaultAnalysis = defaultAnalysis;

