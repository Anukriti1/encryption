'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries.js');

// apis 
// for login api
var logIn = function(req, res) {
	// auth query with username/Password
	if (req.body && req.body.username && req.body.password){
		var data = {};
		data.input = {'LoginUserId':req.body.username,'LoginPassword': req.body.password};
		data.query = 'SELECT * FROM LoginUser INNER JOIN Employees ON LoginUser.EmployeeId = Employees.Id WHERE LoginUserId = @LoginUserId AND LoginPassword = @LoginPassword';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){
			console.log(resData)
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}	
}

// this api is used for update device token
var updateDeviceToken = function(req,res){
	//UPDATE LoginUser SET DeviceToken = 'erewr' WHERE LoginUserId = 'test' AND LoginPassword = 'test'
	if (req.body && req.body.username && req.body.password, req.body.deviceToken){
		var data = {};
		data.input = {'LoginUserId':req.body.username,'LoginPassword': req.body.password,'DeviceToken': req.body.deviceToken};
		data.query = 'UPDATE LoginUser SET DeviceToken = @DeviceToken WHERE LoginUserId = @LoginUserId AND LoginPassword = @LoginPassword';
		// sending queries to db
		queryServe.sqlServe(data,function(resData,affected){
			res.status(200).json(affected);
		});
	} else {
		res.status(401).json({});
	}

}
// login with pin api
var loginPin = function(req, res){
	if(req.body && req.body.pin && req.body.username && req.body.password){
		var data = {};
		data.input = {'LoginUserId':req.body.username,'LoginPassword': req.body.password, 'Pincode' : req.body.pin};
		data.query = 'SELECT * FROM LoginUser INNER JOIN EmployeePincode ON LoginUser.EmployeeId = EmployeePincode.EmployeeId INNER JOIN Employees ON LoginUser.EmployeeId = Employees.Id'
					 +' WHERE LoginUserId = @LoginUserId AND LoginPassword = @LoginPassword AND  Pincode = @Pincode';
		console.log(data)
		queryServe.sqlServe(data,function(resData){
			console.log(resData);
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}
}

// list for New/Hold tasks 
var listUserTask = function(req, res){
	if(req.body && req.body.CompanyId,req.body.EmployeeId){
		var data = {};
		data.input = {'CompanyId': req.body.CompanyId,'EmployeeId':req.body.EmployeeId};
		data.query = 'SELECT  ScheduleTask.Id,ScheduleTask.CompanyId,ScheduleTask.EmployeeId,ScheduleTask.TaskDate,ScheduleTask.TaskName,ScheduleTask.ApprovalStatus '
		+', Job.* , Project.ProjectName FROM ScheduleTask LEFT JOIN Job ON ScheduleTask.Id = Job.ScheduleTaskId INNER JOIN Project ON ScheduleTask.ProjectId = Project.Id'
		+  ' WHERE ScheduleTask.CompanyId = @CompanyId AND ScheduleTask.EmployeeId = @EmployeeId AND (Job.Status IN (0, 1) OR Job.Status IS NULL)';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){
			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}
}

// assign apis to router
router.post('/listUserTask', listUserTask);
router.post('/updateToken', updateDeviceToken);
router.post('/login', logIn);
router.post('/loginPin', loginPin);
module.exports = router;