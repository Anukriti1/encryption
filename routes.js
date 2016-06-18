/**
 * Main application routes
 */

'use strict';

var errors = require('./errors');

module.exports = function(app) {
// routes
  app.use('/login', require('./api/login'));
  app.use('/query', require('./api/mssql_quries'));
};
