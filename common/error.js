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

// define errors in OVP
var all_errors = [];

var Errors = {
  // define error here, every has format like [error_message, http_status_code]
  INVALID_SESSION: _error('INVALID_SESSION', 'Invalid session id', 401),
  LOGIN_ERROR: _error('LOGIN_ERROR', 'Login failure', 401),
  LOGIN_EMPTY_CREDENTIAL_ERROR: _error('LOGIN_EMPTY_CREDENTIAL_ERROR', 'Login with no username or password', 400),
  INVALID_ARGUMENT_ERROR: _error('INVALID_ARGUMENT_ERROR', 'Invalid argument error', 400),
  PASSWORD_CHANGE_REQUIRED: _error('PASSWORD_CHANGE_REQUIRED', 'You are required to change your password.', 403),
  REJECTED_BY_APPLIANCES: _error('REJECTED_BY_APPLIANCES', 'The credential is rejected by all appliances.', 401),
  UNAUTHORIZED_ERROR: _error('UNAUTHORIZED_ERROR', 'User is unauthorized', 401),
  NOT_FOUND: _error('NOT_FOUND', "Cannot find request resource", 404),
  INVALID_PATCH: _error('INVALID_PATCH', "Patch request body is invalid.", 400),
  HC380_OPERATION_ONLY: _error('HC380_OPERATION_ONLY', "This operation is supported only on HC380 model.", 400),
  INVALID_APPLIANCE_ADDRESS: _error('INVALID_APPLIANCE_ADDRESS', 'Hostname or IP address does not exist.', 400),
  ADDRESS_MISMATCH_CER: _error('ADDRESS_MISMATCH_CER', 'Hostname or IP is not in the certificate\'s list.', 400),

  // ElsticSearch Error
  ES_NO_CONNECTION: _error( 'ES_NO_CONNECTION', 'No living connections to elasticsearch', 500 ),
  ES_INDICES_CREATE_ERROR: _error( 'ES_INDICES_CREATE_ERROR', 'failed to create elasticsearch indices', 500 ),

  INTERNAL_ERROR: _error('INTERNAL_ERROR', 'Internal Server Error', 500),
  UNIMPLEMENTED_ERROR: _error('UNIMPLEMENTED_ERROR', 'Unimplemented', 400),

  APPLIANCE_NOT_EXITS: _error('APPLIANCE_NOT_EXITS', 'Appliance does not exist.', 400),
  ENCLOSURE_NOT_EXITS: _error('ENCLOSURE_NOT_EXITS', 'Enclosure does not exist.', 400),
  SERVER_NOT_EXITS: _error('SERVER_NOT_EXITS', 'Server does not exist.', 400),

  CREDENTIAL_NOT_FOUND: _error('CREDENTIAL_NOT_FOUND', 'Cannot find credential from credential server.', 400),

  // Sso Error
  GET_ILO_SSO_FAIL: _error('GET_ILO_SSO_FAIL', 'Get server ilo sso fail.', 404),
  GET_OA_SSO_FAIL: _error('GET_OA_SSO_FAIL', 'Get enclosure oa sso fail.', 404),

  FULL_REFRESH_IS_ALREADY_STARTED: _error('FULL_REFRESH_IS_ALREADY_STARTED', 'Full refresh is already started.', 409),

  // Download report error
  REPORT_FORMATION_ERR: _error('REPORT_FORMATION_ERR', 'Report formation error.', 404),
  REPORT_DOWNLOADING_ERR: _error('REPORT_DOWNLOADING_ERR', 'Downloading report fail.', 500),

  // User role check, only Infrastructure user can do the operation
  ROLE_UNAUTHORIZED_ERROR: _error('ROLE_UNAUTHORIZED_ERROR', 'User role is unauthorized for the operation', 401,
                                  'Please retry the operation with an Infrastructure user'),

  // report error to http response
  report_error: function(req, res, error) {
    if (error.status_code >= 500) {
      req.log.error(error.error_message);
    } else {
      req.log.warn(error.error_message);
    }

    let response = {
      errorCode: error.error_code,
      message: error.error_message
    };
    if (error.error_resolutions && error.error_resolutions.length > 0) {
      response.recommendedActions = error.error_resolutions;
    }
    res.status(error.status_code)
      .json(response);
  },

  /**
   * check if the error is OV+ defined error
   * @param {object}  error
   * @return {bool}
   */
  is_defined_error: function( error ) {
    return all_errors.indexOf( error ) >= 0;
  }
};

// define an error
function _error(error_code, error_message, status_code, error_resolutions) {

  let resolutions = [];
  if (error_resolutions) {
    resolutions.push(error_resolutions);
  }

  let newerr = {
    error_code: error_code,
    error_message: error_message,
    status_code: status_code,
    error_resolutions: resolutions
  };

  all_errors.push(newerr);
  return newerr;
}

module.exports = Errors;
