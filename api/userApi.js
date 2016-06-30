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
		queryServe.sqlServe(data,function(resData){
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


// for start a new task
var startTask = function(req,res){
	if(req.body && req.body.CompanyId,req.body.EmployeeId,req.body.ScheduleTaskId){
		var data = {};
		data.input = {'CompanyId': req.body.CompanyId,'EmployeeId': req.body.EmployeeId,'ScheduleTaskId':req.body.ScheduleTaskId,'WSTime': new Date()};
		if(req.body.CurrentPosition && req.body.CurrentPosition.latitude && req.body.CurrentPosition.longitude){
			data.input.WSLatitude = req.body.CurrentPosition.latitude.toString();
			data.input.WSLongitude = req.body.CurrentPosition.longitude.toString();
			data.query = "INSERT INTO Job (CompanyId,EmployeeId,ScheduleTaskId,WSTime,WSLatitude,WSLongitude) VALUES (@CompanyId,@EmployeeId,@ScheduleTaskId,@WSTime,@WSLatitude,@WSLongitude)" 
		} else {
			data.query = "INSERT INTO Job (CompanyId,EmployeeId,ScheduleTaskId,WSTime) VALUES (@CompanyId,@EmployeeId,@ScheduleTaskId,@WSTime)"
		}
		// sending queries to db
		queryServe.sqlServe(data,function(resData,affected){
			res.status(200).json(affected);
		});
	} else {
		res.status(401).json({});
	}
}

// for start a new task
var holdTask = function(req,response){
	if(req.body && req.body.ScheduleTaskId){
		var time = new Date;
		var input = {};
		input.input = {'ScheduleTaskId':req.body.ScheduleTaskId};
		input.query = "SELECT WSTime, WHTime, WorkedHours from Job  WHERE ScheduleTaskId = @ScheduleTaskId";
		queryServe.sqlServe(input,function(res,aff){
			if(res && res[0].WHTime){
				var WorkedHours = parseFloat(res[0].WorkedHours);
				WorkedHours = WorkedHours + parseFloat((time - res[0].WHTime)/(3600000));
				WorkedHours = WorkedHours.toString();
				var data = {};
				data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time,'Status' : 1,'WorkedHours': WorkedHours};
				data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status, WorkedHours = @WorkedHours WHERE ScheduleTaskId = @ScheduleTaskId";
				queryServe.sqlServe(data,function(resData,affected){
					response.status(200).json(affected);
				});
			} 
			else if(res && res[0].WSTime){
				var WorkedHours = ((time - res[0].WSTime)/(3600000)).toString();
				var data = {};
				data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time,'Status' : 1,'WorkedHours': WorkedHours};
				data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status, WorkedHours = @WorkedHours WHERE ScheduleTaskId = @ScheduleTaskId";
				queryServe.sqlServe(data,function(resData,affected){
					response.status(200).json(affected);
				});
			} else {
				response.status(401).json({});
			}
		})
	} else {
		response.status(401).json({});
	}
}

var resumeTask = function(req,response){
	if(req.body && req.body.ScheduleTaskId){
		var data = {};
		var time = new Date;
		data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time,'Status' : 0};
		data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status WHERE ScheduleTaskId = @ScheduleTaskId";
		queryServe.sqlServe(data,function(resData,affected){
			response.status(200).json(affected);
		});
	} else {
		response.status(401).json({});
	}
}

// assign apis to router
router.post('/holdTask',holdTask);
router.post('/startTask',startTask);
router.post('/resumeTask',resumeTask);
router.post('/listUserTask', listUserTask);
router.post('/updateToken', updateDeviceToken);
router.post('/login', logIn);
router.post('/loginPin', loginPin);
module.exports = router;