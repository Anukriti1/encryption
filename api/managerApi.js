'use strict';

var express = require('express');
var router = express.Router();
var queryServe =  require('./mssql_quries');
var sendPush =  require('./notification');
var sendMail =  require('./mail');
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
		data.input = {'CompanyId':req.body.CompanyId,'UserGroupId' : 9};
		data.query = 'SELECT Employees.* FROM Employees INNER JOIN LoginUser ON LoginUser.EmployeeId =  Employees.Id WHERE Employees.CompanyId = @CompanyId AND UserGroupId = @UserGroupId;'
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
	if(req.body && req.body.CompanyId && req.body.TaskDate){
		var data = {};
		data.input = {'CompanyId': req.body.CompanyId, 'TaskDate' : req.body.TaskDate};
		data.query = 'SELECT  ScheduleTask.Id AS task_id ,ScheduleTask.*  ,Employees.* , Job.* , Project.ProjectName FROM ScheduleTask INNER JOIN Employees ON ScheduleTask.EmployeeId = Employees.Id LEFT JOIN Job ON ScheduleTask.Id = Job.ScheduleTaskId LEFT JOIN Project ON ScheduleTask.ProjectId = Project.Id  WHERE ScheduleTask.CompanyId = @CompanyId AND ScheduleTask.TaskDate = @TaskDate';
//		data.query = 'SELECT  ScheduleTask.Id AS task_id , ScheduleTask.*  ,Employees.* , Job.* , Project.ProjectName  FROM ScheduleTask INNER JOIN Employees ON ScheduleTask.EmployeeId = Employees.Id LEFT JOIN Job ON ScheduleTask.Id = Job.ScheduleTaskId INNER JOIN Project ON ScheduleTask.ProjectId = Project.Id  WHERE ScheduleTask.CompanyId = @CompanyId AND ScheduleTask.TaskDate = @TaskDate';
		// sending queries to db
		queryServe.sqlServe(data,function(resData){

			res.status(200).json(resData);
		});
	} else {
		res.status(401).json({});
	}
}

// This api use for getting details of any particular task..
var taskDetail = function(req,res){
    if(req.query['task_id']){
        var data = {};
        data.input = {'Id' : parseInt(req.query['task_id'])};
        data.query = 'SELECT ScheduleTask.*,Job.* FROM ScheduleTask INNER JOIN Job ON  Job.ScheduleTaskId = ScheduleTask.Id WHERE ScheduleTask.Id = @Id';

        // sending queries to db
        console.log(data);
        queryServe.sqlServe(data,function(resData){
            res.status(200).json(resData);
        });
    } else {
        res.status(401).json({});
    }
}
// This api use for getting details of any particular Time Clock Detail..
var timeClockDetail = function(req,res){
    console.log("################################### ");
    console.log(req.query);
    console.log("################################### ");
    if(req.query['TimeClockSummaryDataId']){
        var data = {};
        data.input = {'TimeClockSummaryDataId' : parseInt(req.query['TimeClockSummaryDataId'])};
        data.query = 'SELECT top 1 *  FROM TimeClockDetailData WHERE  TimeClockSummaryData_Id = @TimeClockSummaryDataId ORDER BY id DESC';
        // sending queries to db
        console.log(data);
        queryServe.sqlServe(data,function(resData){
            res.status(200).json(resData);
        });
    } else {
        res.status(401).json({error: "invalid input"});
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

// accept or reject task by a manager
var approveOrReject = function(req, res){
	console.log("------req.body ---------approveOrReject--------------------");
	console.log(req.body );
	console.log("-------------req.body ------approveOrReject----------------");
	if(req.body && req.body.ApprovalStatus && req.body.ScheduleTaskId 
		 && req.body.EmployeeId && req.body.TaskName){
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
			searchtoken.input = { 'Id1' : req.body.EmployeeId, 'Id2' : req.body.ApproveOrRejectBy , 'companyId': req.body.companyId};
			searchtoken.query = "SELECT DeviceToken,Emailid From LoginUser WHERE EmployeeId IN (@Id1,@Id2) or EmployeeId is NULL and companyId = @companyId";
			//"SELECT DeviceToken,Emailid From LoginUser WHERE EmployeeId IN (@Id1,@Id2)";
			
			queryServe.sqlServe(searchtoken,function(resDataTokens){
				var statusAR = (req.body.ApprovalStatus == 1) ? "Approved":"Rejected";
				var message = 'Task: '+ req.body.TaskName+' has been '+statusAR;
	console.log("--------------searchtoken--------------------");
	console.log(searchtoken);
	console.log("-------------------searchtoken----------------");
				sendPushNot(resDataTokens,message,function(data){
					res.status(200).json({'affected': affected});
				})	
			})
		});
	} else {
		res.status(401).json({});
	}
}

// notification when late attendence to manager and employee and also check for 30 min before for overtime request
function lateOvertimePush(req,resP){
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
		if(resD && resD.message) {resP.status(401).json({});}
		if( !resD || !resD.length){/** no data or error**/ resP.status(401).json({})}
		else if((resD[0].timeNow - resD[0].CurrentDate) > (resD[0].ShiftInTime.getTime())){
			// late 
			// find employee and manager device tokens 
			var data1 = {};
			data1.input = {CompanyId : req.body.CompanyId,UserGroupId : req.body.UserGroupId,EmployeeId : req.body.EmployeeId};
			data1.query = "SELECT DeviceToken,Emailid FROM LoginUser WHERE (UserGroupId = @UserGroupId OR EmployeeId = @EmployeeId) AND CompanyId = @CompanyId"
			queryServe.sqlServe(data1,function(resD1){
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
				// checking if employee has the overtime flag 
				if(resD[0].IsOverTime){
					var message = 'Employee '+resD[0].EmployeeName+' is requested for overtime';
					resP.status(200).json({overTime : true,'message' : message});
				} else {
					resP.status(200).json({});
				}
			} else {
				resP.status(200).json({});
			}
		}
	})
}


// overtime request from user and send push

var overtimeReq = function(request, response){
	var data = {};
	data.input = {
		CompanyId : request.body.CompanyId,EmployeeId : request.body.EmployeeId,TimeClockSummaryData_Id: request.body.TimeClockSummaryData_Id
	};
	data.query = "INSERT INTO TimeClockOTRequest (CompanyId,EmployeeId,TimeClockSummaryData_Id,RequestTime) "
			   + " VALUES (@CompanyId,@EmployeeId,@TimeClockSummaryData_Id,GETDATE())";
	queryServe.sqlServe(data,function(resD1,aff){
		if((resD1 && resD1.message) || (aff && (aff < 1))) {response.status(401).json({});}
		else {
			var data1 = {};
			data1.input = {CompanyId : request.body.CompanyId,UserGroupId : request.body.UserGroupId,EmployeeId : request.body.EmployeeId};
			data1.query = "SELECT DeviceToken,Emailid FROM LoginUser WHERE (UserGroupId = @UserGroupId OR EmployeeId = @EmployeeId) AND CompanyId = @CompanyId"
			queryServe.sqlServe(data1,function(resD2){
				if(resD2 && resD2.message) {response.status(401).json({});}
				sendPushNot(resD2,request.body.message,function(data2){
					response.status(200).json({"aff":aff});
				})
			})
		}		
	})
}

// approve or reject Overtime request by manager
var appRejOTReq = function(request,response) {
	var data = {};
	var EmpName = '';
	data.input = {
		'Status': request.body.Status,
		'Id': request.body.TimeClockOTRequest_Id, 
		'ApproveOrRejectBy' : request.body.ApproveOrRejectBy,
		'EmployeeId': request.body.EmployeeId
	};
	data.query = "UPDATE TimeClockOTRequest SET Status = @Status, "+
				"ApproveOrRejectBy = @ApproveOrRejectBy, ApproveOrRejectOn = GETDATE()"
				+"  WHERE Id = @Id AND EmployeeId = @EmployeeId; SELECT * FROM TimeClockOTRequest WHERE Id = @Id AND EmployeeId = @EmployeeId";
	queryServe.sqlServe(data,function(resD1,aff){
		if(resD1 && resD1.message) {response.status(401).json({});}
		var data1 = {};
		data1.input = {EmployeeId : data.input.EmployeeId,ManagerId : data.input.ApproveOrRejectBy};
		data1.query = "SELECT DeviceToken,Emailid,EmployeeName,Employees.Id FROM LoginUser INNER JOIN Employees ON  Employees.Id = LoginUser.EmployeeId WHERE LoginUser.EmployeeId IN (@EmployeeId,@ManagerId);"
		queryServe.sqlServe(data1,function(resD2,aff2){
			if(resD2 && resD2.message) {response.status(401).json({});}
			async.forEach(resD2,function(item, callbackA){
				if(item.Id == data.input.EmployeeId){
					EmpName = item.EmployeeName;
					callbackA()
				} else {
					callbackA()
				}
			},function(){
				var ResStatus = 'Accepted'
				if(data.input.Status == 2)
					ResStatus = 'Rejected' 
				var message = EmpName+"'s " + "Overtime request has been "+ResStatus;
				sendPushNot(resD2,message,function(data3){
					response.status(200).json(data3);
				})
			})
		})
	})
}


// approve or reject clock by manager
var clockAccRej = function(req,res) {
	var data = {};
	var EmpName = '';
	data.input = {
		'Status': req.body.Status,
		'Id': req.body.Id, 
		'ApproveOrRejectBy' : req.body.ApproveOrRejectBy,
		'EmployeeId': req.body.EmployeeId,
		'CompanyId': req.body.CompanyId
	};
	data.query = "UPDATE TimeClockSummarydata SET Status = @Status"+
				", ApproveOrRejectBy = @ApproveOrRejectBy, ApproveOrRejectOn = GETDATE()"+
				"  WHERE Id = @Id AND EmployeeId = @EmployeeId;"
	queryServe.sqlServe(data,function(resD1,aff){
		if(resD1 && resD1.message) {res.status(401).json({});}
		var data1 = {};
		data1.input = {'Status': data.input.Status, CompanyId :data.input.CompanyId, EmployeeId : data.input.EmployeeId,ManagerId : data.input.ApproveOrRejectBy,TimeClockSummaryData_Id: data.input.Id};
		data1.query = "SELECT DeviceToken,Emailid,EmployeeName,Employees.Id FROM LoginUser INNER JOIN Employees ON  Employees.Id = LoginUser.EmployeeId WHERE LoginUser.EmployeeId IN (@EmployeeId,@ManagerId);"
		+" INSERT INTO TimeClockManageLogData (CompanyId,EmployeeId,TimeClockSummaryData_Id,Status)  VALUES (@CompanyId,@EmployeeId,@TimeClockSummaryData_Id,@Status);"
		queryServe.sqlServe(data1,function(resD2,aff1){
			if(resD2 && resD2.message) {res.status(401).json({});}
			async.forEach(resD2,function(item, callbackA){
				if(item.Id == data.input.EmployeeId){
					EmpName = item.EmployeeName;
					callbackA()
				} else {
					callbackA()
				}
			},function(){
				var ResStatus = 'Accepted'
				if(data.input.Status == 2)
					ResStatus = 'Rejected' 
				var message = EmpName+"'s " + "CLock has been "+ResStatus;
				sendPushNot(resD2,message,function(data3){
					res.status(200).json(data3);
				})
			})
		})
	})
}


// Time Clock list for employees for today

var tClock = function(req,res){
	if(req.body && req.body.CompanyId && req.body.UserGroupId && req.body.clockInDate){
		var data = {};
        console.log("*******************************");
        console.log("***********inside Tclock*******");
        console.log("*******************************");
		console.log(req.body.EmployeeId);
		if(req.body.EmployeeId== "" || req.body.EmployeeId== 'undefined'){
            console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
            console.log("inside if possible ");
            console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
			data.input = {"CompanyId" : req.body.CompanyId, 'UserGroupId' : req.body.UserGroupId, 'ClockInDate': req.body.clockInDate};
			data.query = "SELECT EmployeeName, Employees.Id AS Employee_Id ,TimeClockSummaryData.*,TimeClockOTRequest.*,TimeClockOTRequest.Id AS TimeClockOTRequest_Id, TimeClockSummaryData.Id AS TimeClockSummaryDataId "
		+" ,TimeClockSummaryData.Status AS SummaryStatus"
		+" FROM Employees INNER JOIN LoginUser ON Employees.Id = LoginUser.EmployeeId "
		+"INNER JOIN TimeClockSummaryData ON Employees.Id = TimeClockSummaryData.EmployeeId "
		+"LEFT JOIN TimeClockOTRequest ON TimeClockOTRequest.TimeClockSummaryData_Id = TimeClockSummaryData.Id "
		+" WHERE ClockInDate = @ClockInDate AND TimeClockSummaryData.CompanyId = @CompanyId AND LoginUser.UserGroupId = @UserGroupId";
		}else{
            console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
            console.log("inside if not");
            console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
			data.input = {"CompanyId" : req.body.CompanyId, 'UserGroupId' : req.body.UserGroupId, 'ClockInDate': req.body.clockInDate,'EmployeeId': req.body.EmployeeId};
			data.query = "SELECT EmployeeName, Employees.Id AS Employee_Id ,TimeClockSummaryData.*,TimeClockOTRequest.*,TimeClockOTRequest.Id AS TimeClockOTRequest_Id, TimeClockSummaryData.Id AS TimeClockSummaryDataId "
		+" ,TimeClockSummaryData.Status AS SummaryStatus"
		+" FROM Employees INNER JOIN LoginUser ON Employees.Id = LoginUser.EmployeeId "
		+"INNER JOIN TimeClockSummaryData ON Employees.Id = TimeClockSummaryData.EmployeeId "
		+"LEFT JOIN TimeClockOTRequest ON TimeClockOTRequest.TimeClockSummaryData_Id = TimeClockSummaryData.Id "
		+" WHERE ClockInDate = @ClockInDate AND TimeClockSummaryData.CompanyId = @CompanyId AND LoginUser.UserGroupId = @UserGroupId AND TimeClockSummaryData.EmployeeId = @EmployeeId";

            console.log("%%%%%%%%%%%%%data%%%%%%%%%%%%%%%%%%");
            console.log(data);

		}
		
		queryServe.sqlServe(data,function(resD,aff){
			if(resD && resD.message) {res.status(401).json({});}
			res.status(200).json(resD);
		})
	} else {
		res.status(401).json({});
	}
}


// List of Employees for today clock In With Overtime Request

var listOvertime = function(req,res){
	if(req.body && req.body.CompanyId && req.body.UserGroupId){
		var data = {};
		data.input = {"CompanyId" : req.body.CompanyId, 'UserGroupId' : req.body.UserGroupId};
		data.query = "SELECT EmployeeName, Employees.Id AS Employee_Id ,TimeClockSummaryData.*,TimeClockOTRequest.*,TimeClockOTRequest.Id AS TimeClockOTRequest_Id, TimeClockSummaryData.Id AS TimeClockSummaryData_Id "
		+",TimeClockOTRequest.Status AS OTStatus "
		+"FROM Employees INNER JOIN LoginUser ON Employees.Id = LoginUser.EmployeeId "
		+"LEFT JOIN TimeClockSummaryData ON Employees.Id = TimeClockSummaryData.EmployeeId "
		+"INNER JOIN TimeClockOTRequest ON TimeClockOTRequest.TimeClockSummaryData_Id = TimeClockSummaryData.Id "
		+" WHERE ClockInDate >= CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE())) AND TimeClockSummaryData.CompanyId = @CompanyId AND LoginUser.UserGroupId = @UserGroupId ORDER BY ClockInDate DESC";
		queryServe.sqlServe(data,function(resD,aff){
			if(resD && resD.message) {res.status(401).json({});}
			res.status(200).json(resD);
		})
	} else {
		res.status(401).json({});
	}
}

// Employee with his current date tasks and clocks
var emPList = function(req,res){
	if(req.body && req.body.Id){
		var data = {};
		data.input = {"Id" : req.body.Id};
		data.query = "SELECT Employees.Id AS Employees_Id , Employees.EmployeeName, Project.ProjectName, ScheduleTask.*,TimeClockSummaryData.* "
		+ "FROM Employees INNER JOIN LoginUser ON Employees.Id = LoginUser.EmployeeId "
		+"LEFT JOIN ScheduleTask ON Employees.Id = ScheduleTask.EmployeeId AND TaskDate >= CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE())) AND TaskDate < CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE()+1)) "
		+"LEFT JOIN Project ON ScheduleTask.ProjectId = Project.Id "
		+"LEFT JOIN TimeClockSummaryData ON TimeClockSummaryData.EmployeeId = Employees.Id AND TimeClockSummaryData.ClockInDate >= CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE())) "
		+" WHERE Employees.Id = @Id"
		queryServe.sqlServe(data,function(resD,aff){
			if(resD && resD.message) {res.status(401).json({});}
			res.status(200).json(resD);
		})
	} else {
		res.status(401).json({});
	}
}
// employee details on managerDashbord for current date.

var emPListDetails = function(req,res){
	if(req.body){
		var data = {};
		data.input = {};
		data.query = "SELECT Employees.Id AS Employees_Id , Employees.EmployeeName, Project.ProjectName, ScheduleTask.*,TimeClockSummaryData.* "
		+ "FROM Employees INNER JOIN LoginUser ON Employees.Id = LoginUser.EmployeeId "
		+"LEFT JOIN ScheduleTask ON Employees.Id = ScheduleTask.EmployeeId AND TaskDate = CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE())) AND TaskDate = CONVERT(DateTime, DATEDIFF(DAY, 0, GETDATE())) "
		+"LEFT JOIN Project ON ScheduleTask.ProjectId = Project.Id "
		+"LEFT JOIN TimeClockSummaryData ON TimeClockSummaryData.EmployeeId = Employees.Id  "
		queryServe.sqlServe(data,function(resD,aff){
			if(resD && resD.message) {res.status(401).json({});}
			res.status(200).json(resD);
		})
	} else {
		res.status(401).json({});
	}
}

// for sending push notification
function sendPushNot(resDataTokens,message,callback){
	var tokens = [];
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
			console.log(data);
			// Send Emails
			sendEmail(resDataTokens, message);
			callback(data);
		})
	})
}

// for sending Email Notification
function sendEmail(resDataTokens,message){
	var emails = [];
	async.forEach(resDataTokens,function(item, callbackA){
		if((!(item.Emailid == null) && item.Emailid )){
			emails.push(item.Emailid)
			callbackA();
		} else {
			callbackA();
		}
	},function(){
		emails.toString();
		sendMail.send_mail(message, emails.toString())
	})
}

router.post('/emPList',emPList);
router.post('/emPListDetails',emPListDetails);
router.post('/listOvertime',listOvertime)
router.post('/clockAccRej',clockAccRej);
router.post('/appRejOTReq',appRejOTReq)
router.post('/overtimeReq', overtimeReq);
router.post('/approveOrReject',approveOrReject);
router.post('/lateOvertimePush',lateOvertimePush);
router.post('/listTask',listTask);
router.post('/create_task',create_task);
router.post('/allProjectsList',allProjects);
router.post('/allEmp',allEmp);
router.post('/tClock', tClock);
router.get('/particularTaskDetail', taskDetail);
router.get('/getTimeClockDetail', timeClockDetail);
module.exports = router;