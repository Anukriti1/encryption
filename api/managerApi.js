'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries.js');
var async = require('async');

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

// Create a task for multiple employees 
/**Sample input
var keys = ['CompanyId','EmployeeId','TaskDate','TaskName','StartDateTime','EndDateTime','Hours','ProjectId','Status']
var values = [
	[1,1,'06/01/2016 00:00:00','test','06/01/2016 14:00:00','06/01/2016 13:00:00',1.5,2,0],
	[1,2,'06/01/2016 00:00:00','test1','07/01/2016 14:00:00','07/01/2016 13:00:00',2,1,1]
];
**/

var create_task = function(req, res){
	if(req.body.keys && req.body.values){
		var data = {};
		data.input = {};
		var keys = req.body.keys;
		var values = req.body.values;
		generateInputQuery(data,values,keys,function(queryValues){
			// generate query string
			genrateQueryAddtask(queryValues,keys, function(queryStr){
				data.query = queryStr;
				queryServe.sqlServe(data,function(resData,affected){
					if(resData && resData.message){
						res.status(401).json({});
					} else{
						res.status(200).json({'affected': affected});
					}
				});
			});
		})
	} else {
		res.status(401).json({});
	}
}

// query string generation for create task
function genrateQueryAddtask(queryValues,keys,callback){
	var queryStr = 'INSERT INTO ScheduleTask ('+keys.toString()+') VALUES ';
	var str = [];
	async.forEach(queryValues,function(value, callbackA){
		str.push("("+value+")");
		callbackA();
	},function(){
		callback(queryStr+str.toString());
	})
}

/** input string generate and adding queries for 
multiple values for create task api**/ 
function generateInputQuery(data,values,keys,callback){
	var queryValues = [];
	var j = 0;
	async.forEach(values,function(value, callbackA){	
		j++;
		var str = [];
		var i = 0;
		async.forEach(value,function(val, callbackB){
			data.input[keys[i]+j] = val;
			str.push('@'+keys[i]+j);
			i++;
			callbackB();
		},function(){
			queryValues.push(str.toString());
			callbackA()
		})
	},function(){
		callback(queryValues);
	})
}

router.post('/create_task',create_task);
router.post('/allProjectsList',allProjects);
router.post('/allEmp',allEmp);
module.exports = router;