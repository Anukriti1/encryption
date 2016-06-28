module.exports = {
	
	db: {
		type : 'mssql',
		username : 'DB_A059D9_rtailwal_admin' ,
		password : 'testing123',
		database_name : 'DB_A059D9_rtailwal',
		host : 'SQL5027.Smarterasp.net',
		connectionTimeout : 99000,
		requestTimeout : 99000,
		pool: {
	        max: 50,
	        min: 0,
	        idleTimeoutMillis: 30000
	    }
	}
}