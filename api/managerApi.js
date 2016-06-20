'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries.js');

// All project list for a compnay
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
// this api is for getting all employee list for a company
var allEmp = function(req, res) {
	// auth query with username/Password
	if(req.body && req.body.CompanyId){
		var data = {};
		data.input = {'CompanyId':req.body.CompanyId};
		data.query = 'SELECT * FROM Employees WHERE CompanyId = @CompanyId';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}	
}
router.post('/allProjectsList',allProjects);
router.post('/allEmp',allEmp);
module.exports = router;