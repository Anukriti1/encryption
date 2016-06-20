/**
 * Main application routes
 */

'use strict';

var errors = require('./errors');

module.exports = function(app) {
// routes
  app.use('/userApi', require('./api/userApi'));
  app.use('/managerApi', require('./api/managerApi'));
};
