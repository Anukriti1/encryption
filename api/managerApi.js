'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries.js');

// input comes as compney id from front end and manager can fetch it
var allProjects = function(req, res) {
	// auth query with username/Password
	if(req.body && req.body.CompanyId){
		var data = {};
		data.input = {'CompanyId':req.body.CompanyId};
		data.query = 'SELECT * FROM Project WHERE CompanyId = @CompanyId';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}	
}
router.post('/allProjectsList',allProjects);
module.exports = router;