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
	if(req.body && req.body.CompanyId && req.body.EmployeeId && req.body.ScheduleTaskId){
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

// Update status of task to scheduled task table 
function updateScheduleTask(ScheduleTaskId,status,callback){
	var data = {};
	data.input = {'Status': status,'Id':ScheduleTaskId};
	data.query = "UPDATE ScheduleTask SET Status = @Status WHERE Id = @Id";
	queryServe.sqlServe(data,function(resData,affected){
		callback(affected);
	});
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
					updateScheduleTask(req.body.ScheduleTaskId,1,function(){
						response.status(200).json(affected);
					})
				});
			} 
			else if(res && res[0].WSTime){
				var WorkedHours = ((time - res[0].WSTime)/(3600000)).toString();
				var data = {};
				data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time,'Status' : 1,'WorkedHours': WorkedHours};
				data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status, WorkedHours = @WorkedHours WHERE ScheduleTaskId = @ScheduleTaskId";
				queryServe.sqlServe(data,function(resData,affected){
					updateScheduleTask(req.body.ScheduleTaskId,1,function(){
						response.status(200).json(affected);
					})
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
			updateScheduleTask(req.body.ScheduleTaskId,0,function(){
						response.status(200).json(affected);
			})
		});
	} else {
		response.status(401).json({});
	}
}

var endTask = function(req,response){
	if(req.body && req.body.ScheduleTaskId){
		console.log(req.body)
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
				if(req.body.CurrentPosition && req.body.CurrentPosition.latitude && req.body.CurrentPosition.longitude){
					data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time, 'WETime' : time, 'Status' : 2,'WorkedHours': WorkedHours,
									'WELatitude' : req.body.CurrentPosition.latitude.toString(), 'WELongitude': req.body.CurrentPosition.longitude.toString(),
									'UploadPhoto' : req.body.imageData};
					data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status, "
								+"WETime = @WETime, WorkedHours = @WorkedHours, "
								+"WELatitude = @WELatitude, WELongitude = @WELongitude, "
								+"imageBase64 = @UploadPhoto "
								+"WHERE ScheduleTaskId = @ScheduleTaskId";
				} else {
					data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time, 'WETime' : time, 'Status' : 2,'WorkedHours': WorkedHours,'UploadPhoto' : req.body.imageData};
					data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status,imageBase64 = @UploadPhoto , WETime = @WETime, WorkedHours = @WorkedHours WHERE ScheduleTaskId = @ScheduleTaskId";
				}
				queryServe.sqlServe(data,function(resData,affected){
					updateScheduleTask(req.body.ScheduleTaskId,2,function(){
						response.status(200).json(affected);
					})
				});
			} 
			else if(res && res[0].WSTime){
				var WorkedHours = ((time - res[0].WSTime)/(3600000)).toString();
				var data = {};
				if(req.body.CurrentPosition && req.body.CurrentPosition.latitude && req.body.CurrentPosition.longitude){
					data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time, 'WETime' : time,
								'Status' : 2,'WorkedHours': WorkedHours, 'WELatitude' : req.body.CurrentPosition.latitude.toString(),
								'WELongitude': req.body.CurrentPosition.longitude.toString(), 'UploadPhoto' : req.body.imageData};
					data.query = "UPDATE Job SET WHTime = @WHTime,Status = @Status,  WETime = @WETime, "
								+"WorkedHours = @WorkedHours ,"
								+"WELatitude = @WELatitude, WELongitude = @WELongitude, "
								+"imageBase64 = @UploadPhoto "
								+"WHERE ScheduleTaskId = @ScheduleTaskId";
				} else {
					data.input = {'ScheduleTaskId':req.body.ScheduleTaskId,'WHTime': time,'UploadPhoto' : req.body.imageData, 'WETime' : time,'Status' : 2,'WorkedHours': WorkedHours};
					data.query = "UPDATE Job SET WHTime = @WHTime, imageBase64 = @UploadPhoto, Status = @Status,  WETime = @WETime, WorkedHours = @WorkedHours WHERE ScheduleTaskId = @ScheduleTaskId";
				}		
				queryServe.sqlServe(data,function(resData,affected){
					updateScheduleTask(req.body.ScheduleTaskId,2,function(){
						response.status(200).json(affected);
					})
				});
			} else {
				response.status(401).json({});
			}
		})
	} else {
		response.status(401).json({});
	}
}

// this API for clockin status of any employee for today
var clockInStatus = function(req,response){
	if(req.body.EmployeeId){
		var data = {};
		data.input = {'EmployeeId': req.body.EmployeeId};
		data.query = "SELECT TOP 1 * from TimeClockDetailData  WHERE EmployeeId = @EmployeeId ORDER BY InTime DESC";
		queryServe.sqlServe(data,function(resData,affected){
			response.status(200).json(resData);
		})
	} else {
		response.status(401).json({});	
	}
}

		
// time clock api 
var clockInOut = function(){
	var data = {};
	var d = new Date();
	data.input = {
		EmployeeId : 2
	};
	// 1 for punch in 2 for punchout
	var clockAction = 2;
	// for clock in 
	if(clockAction == 1){
		data.query = "SELECT TOP 1 * from TimeClockSummaryData WHERE EmployeeId = @EmployeeId ORDER BY ClockInDate DESC;";
		queryServe.sqlServe(data,function(resData,affected){
			if(!resData) {}
			if(resData){
				if(resData.length == 0){
					var input = {};
					input.input = {CompanyId : 1,EmployeeId : 2, ClockInDate : new Date(),ClockInTime : new Date()};
					input.query="INSERT INTO TimeClockSummaryData (CompanyId,EmployeeId,ClockInDate,ClockInTime) VALUES (@CompanyId,@EmployeeId,@ClockInDate,@ClockInTime);"
					queryServe.sqlServe(input,function(resData1,affected1){
						console.log(affected1)
					})
				} else {
					getDbServerDateToday(function(dateData){
						if(Date.parse(resData[0].ClockInDate) == Date.parse(dateData[0].CurrentDateTime)){
							// same date record exists
						} else {
							//record is not exists for the same date
							var input = {};
							input.input = {CompanyId : 1,EmployeeId : 2, ClockInDate : new Date(),ClockInTime : new Date()};
							input.query="INSERT INTO TimeClockSummaryData (CompanyId,EmployeeId,ClockInDate,ClockInTime) VALUES (@CompanyId,@EmployeeId,@ClockInDate,@ClockInTime);"
							queryServe.sqlServe(input,function(resData1,affected1){
								console.log(affected1)
							})
						}
					})
				}
			}
		})
	}
	// for clock out 
	if(clockAction == 2){
		data.query = "SELECT TOP 1 * from TimeClockSummaryData WHERE EmployeeId = @EmployeeId ORDER BY ClockInDate DESC;";
		queryServe.sqlServe(data,function(resData,affected){
			if(!resData) {}
			if(resData){
				if(resData.length == 0){
					// not punch in yet
				} else {
					getDbServerDateToday(function(dateData){
						if(Date.parse(resData[0].ClockInDate) == Date.parse(dateData[0].CurrentDateTime)){
							console.log(resData[0]);
							// update table for punch out
							var data = {};
							data.input = {'ClockOutDate':d,'ClockOutTime': d,'Id': resData[0].Id};
							data.query = 'UPDATE TimeClockSummaryData SET ClockOutDate = @ClockOutDate, ClockOutTime = @ClockOutTime WHERE Id = @Id';	
							queryServe.sqlServe(data,function(resData3,affected3){
								console.log(affected3)
							})
						} else {
							// Not punch in today yet
						}
					})
				}
			}
		})
	}		
}

// clockInOut();

// db server date today
function getDbServerDateToday (callback) {
	var input = {};
	input.query = "SELECT DATEADD(day, DATEDIFF(day, 0, GETDATE()), 0) AS CurrentDateTime";
	queryServe.sqlServe(input,function(resData2){
		callback(resData2)
	})
}

// assign apis to router
router.post('/clockInStatus',clockInStatus);
router.post('/holdTask',holdTask);
router.post('/endTask',endTask);
router.post('/startTask',startTask);
router.post('/resumeTask',resumeTask);
router.post('/listUserTask', listUserTask);
router.post('/updateToken', updateDeviceToken);
router.post('/login', logIn);
router.post('/loginPin', loginPin);
module.exports = router;