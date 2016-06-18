var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var port = process.env.PORT || 8085;

// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'enbake123',
//   database : 'e-scheduling'
// });
 
// connection.connect();
 
// connection.query('SELECT * FROM Employees LEFT JOIN Company ON Employees.CompanyId = Company.Id', function(err, rows, fields) {
//   if (err) throw err;
//   //console.log('The solution is: ', rows[0].solution);
//   console.log(rows)
// });
 

require('./routes')(app);


// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  res.send('hello world');
});

app.post('/task', function(req, res) {
	console.log('dfsgdf');
	console.log(req.body);
	if(req.body && req.body.username && req.body.password){
		if(
			(req.body.username == users.LoginUserId || req.body.username == users.Emailid)
			&& (req.body.password == users.LoginPassword)
		)
		{
			res.status(200).json(tasks);
		} else {
			res.status(401).json({});
		}
	} else {
		res.status(401).json({});
	}
  	
});
 var tasks = [
  {
    id: 1,
    name: "T1"
  }, {
    id: 2,
    name: 'T2'
  }, {
    id: 3,
    name: 'T3',
  }
];

// Start server
var server = app.listen(port, function () {
	var host = server.address().address
	console.log("Example app listening at http://%s:%s", host, port);
})
// Expose app
exports = module.exports = app;