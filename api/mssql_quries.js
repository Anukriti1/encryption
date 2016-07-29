'use strict';

var express = require('express');
var sql = require('mssql');
var async = require('async');
var db_config = require('../config/db_config');
var connect_query = db_config.db.type+"://"+db_config.db.username+':'
+db_config.db.password+'@'+db_config.db.host+'/'+db_config.db.database_name+'?connectionTimeout='+db_config.db.connectionTimeout+'&requestTimeout='+db_config.db.requestTimeout+'&pool='+db_config.db.pool;

/**
This is the root funtion for all queries from ms sql
example request {"input":{"id":2},"query":"select * from Employees where id = @id"}
**/
exports.sqlServe = function(data,callbackRes){
	sql.connect(connect_query).then(function() {
		var request = new sql.Request();
		if(data.query){
			// cheking for input 
			createReqInp(data.input,request,function(){
				console.log('got input')
				request.query(data.query, function(err, recordset,affected) {
					console.log(err, recordset,affected)
				    if(err){
				    	console.log(err);
				    	callbackRes({'message' : 'error in database query'});
				    }
				    callbackRes(recordset,affected);
				});
			})
		} else {
			callbackRes({'message' : 'missing query'});
		}
	}).catch(function(err) {
		console.log('not connect')
		callbackRes({'message' : 'error in database connection'});
		console.log(err)
	});
}

/**creating input request mssql,
for preventing sql injection**/
var createReqInp = function(input,request,callback){
	if(typeof(input) == 'undefined' || !Object.keys(input).length){
		callback();
	} else {
		var inps = Object.keys(input);
		async.forEach(inps,function(inp, callbackA){
			request.input(inp, input[inp]);
			callbackA();
		},function(){
			callback();
		})
	}
}
module.exports = exports;