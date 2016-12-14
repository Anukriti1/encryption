module.exports = {
	
	db: {
		type : 'mssql',
		username : 'DB_A14FFB_mysql_admin' ,
		password : 'enbake123',
		database_name : 'DB_A14FFB_mysql',
		host : 'sql5032.smarterasp.net',
		connectionTimeout : 99000,
		requestTimeout : 99000,
		pool: {
	        max: 50,
	        min: 0,
	        idleTimeoutMillis: 30000
	    }
	}
}

