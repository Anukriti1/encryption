'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries');
var sendPush =  require('./notification');
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

// this api is for getting all list of tasks for a company
var listTask = function(req, res){
	if(req.body && req.body.CompanyId){
		var data = {};
		data.input = {'CompanyId': req.body.CompanyId};
		data.query = 'SELECT  ScheduleTask.*  ,Employees.* , Job.* , Project.ProjectName FROM ScheduleTask INNER JOIN Employees ON ScheduleTask.EmployeeId = Employees.Id LEFT JOIN Job ON ScheduleTask.Id = Job.ScheduleTaskId INNER JOIN Project ON ScheduleTask.ProjectId = Project.Id  WHERE ScheduleTask.CompanyId = @CompanyId';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}
}
// Create a task for multiple employees 

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

// accept or reject by a manager
var approveOrReject = function(req, res){
	if(req.body && req.body.ApprovalStatus && req.body.ScheduleTaskId 
		&& req.body.ApproveOrRejectBy && req.body.EmployeeId && req.body.TaskName){
		var data = {};
		data.input = {
			'ApprovalStatus': req.body.ApprovalStatus,
			'Id': req.body.ScheduleTaskId, 
			'ApproveOrRejectBy' : req.body.ApproveOrRejectBy
		};
		data.query = "UPDATE ScheduleTask SET ApprovalStatus = @ApprovalStatus, "+
					"ApproveOrRejectBy = @ApproveOrRejectBy"
					+"  WHERE Id = @Id";
		queryServe.sqlServe(data,function(resData,affected){
			var searchtoken = {};
			searchtoken.input = { 'Id1' : req.body.EmployeeId, 'Id2' : req.body.ApproveOrRejectBy};
			searchtoken.query = "SELECT DeviceToken From LoginUser WHERE EmployeeId IN (@Id1,@Id2)";
			queryServe.sqlServe(searchtoken,function(resDataTokens){
				var statusAR = (req.body.ApprovalStatus == 1) ? "Approved":"Rejected";
				var message = 'Task: '+ req.body.TaskName+' is '+statusAR;
				sendPushNot(resDataTokens,message,function(data){
					res.status(200).json({'affected': affected});
				})	
			})
		});
	} else {
		res.status(401).json({});
	}
}

// notification when late attendence to manager and employee
function latePuchInPush(req,resP){
	var data = {};
	data.input = {
		EmployeeId : req.body.EmployeeId,
		CompanyId : req.body.CompanyId
	};
	data.query = "SELECT *, "
	+"DATEADD(day, DATEDIFF(day, 0, GETDATE()), 0) AS CurrentDate, GETDATE() as timeNow FROM Shift INNER JOIN ShiftDetail ON Shift.Id = ShiftDetail.ShiftId INNER JOIN "
	+ " ShiftType ON ShiftType.ID = ShiftDetail.ShiftTypeId INNER JOIN "
	+ " ShiftEmployee ON Shift.Id = ShiftEmployee.ShiftId INNER JOIN Employees ON ShiftEmployee.EmployeeId = Employees.Id WHERE ShiftEmployee.EmployeeId = @EmployeeId AND ShiftDetail.CompanyId = @CompanyId"
	queryServe.sqlServe(data,function(resD){
		console.log(resD);
		if(resD && resD.message) {resP.status(401).json({});}
		if( !resD || !resD.length){/** no data or error**/ resP.status(401).json({})}
		else if((resD[0].timeNow - resD[0].CurrentDate) > (resD[0].ShiftInTime.getTime())){
			// late 
			// find employee and manager device tokens 
			var data1 = {};
			data1.input = {CompanyId : req.body.CompanyId,UserGroupId : req.body.UserGroupId,EmployeeId : req.body.EmployeeId};
			data1.query = "SELECT DeviceToken FROM LoginUser WHERE (UserGroupId = @UserGroupId OR EmployeeId = @EmployeeId) AND CompanyId = @CompanyId"
			queryServe.sqlServe(data1,function(resD1){
				console.log(resD1);
				if(resD1 && resD1.message) {resP.status(401).json({});}
				var message = 'Employee '+resD[0].EmployeeName+' reached late';
				sendPushNot(resD1,message,function(data2){
					resP.status(200).json(data2);
				})
			})
		} else {
			// no late
			var diff = ((resD[0].timeNow - resD[0].CurrentDate) - (resD[0].ShiftInTime.getTime()));
			if (diff < 0 && (-diff) >=(1.8e+6)){
				// over time flag
				resP.status(200).json({overTime : true});
			} else {
				resP.status(200).json({});
			}
		}
	})
}

function sendPushNot(resDataTokens,message,callback){
	var tokens = [];
	console.log(resDataTokens)
	async.forEach(resDataTokens,function(item, callbackA){
		if((!(item.DeviceToken == null) && item.DeviceToken )){
			tokens.push(item.DeviceToken)
			callbackA();
		} else {
			callbackA();
		}
	},function(){
		console.log(tokens);
		sendPush.send_gcm(message,tokens,function(data){
			callback(data)
		})
	})
}


router.post('/approveOrReject',approveOrReject);
router.post('/latePuchInPush',latePuchInPush);
router.post('/listTask',listTask);
router.post('/create_task',create_task);
router.post('/allProjectsList',allProjects);
router.post('/allEmp',allEmp);
module.exports = router;