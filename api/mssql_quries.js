'use strict';

var express = require('express');
var router = express.Router();
var sql = require('mssql');
var async = require('async');
var db_config = require('../config/db_config');
var connect_query = db_config.db.type+"://"+db_config.db.username+':'
+db_config.db.password+'@'+db_config.db.host+'/'+db_config.db.database_name;

/**
This is the root funtion for all queries from ms sql
example request {"input":{"id":2},"query":"select * from Employees where id = @id"}
**/
var sqlServe = function(req,res){
	console.log(req.body)
	sql.connect(connect_query).then(function() {
		var request = new sql.Request();
		if(req.body.query){
			// cheking for input 
			createReqInp(req.body.input,request,function(){
				request.query(req.body.query, function(err, recordset) {
				    if(err){
				    	console.log(err);
				    	res.status(401).json({'message' : 'error in database query'});
				    }
				    // closing connection
				    sql.close();
				    res.status(200).json(recordset);
				});
			})
		} else {
			res.status(401).json({'message' : 'missing query'});
		}
	}).catch(function(err) {
		res.status(401).json({'message' : 'error in database connection'});
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
router.post('/', sqlServe);
module.exports = router;