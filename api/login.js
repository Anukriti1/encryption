'use strict';

var express = require('express');
var router = express.Router();

// apis 
// for login api
var logIn = function(req, res) {
	if(req.body && req.body.username && req.body.password){
		if(
			(req.body.username == users.LoginUserId || req.body.username == users.Emailid)
			&& (req.body.password == users.LoginPassword)
		)
		{
			res.status(200).json(users);
		} else {
			res.status(401).json({});
		}
	} else {
		res.status(401).json({});
	}	
}
var users = {
	'id' : 1,
	'LoginUserId' : 'test',
	'LoginPassword' : 'test',
	'Emailid': "test@gmail.com",
	'type' : 1
};

router.post('/', logIn);


module.exports = router;