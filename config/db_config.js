module.exports = {
	
	db: {
		type : 'mssql',
		username : 'DB_A110FC_chetan123_admin' ,
		password : 'testing123',
		database_name : 'DB_A110FC_chetan123',
		host : 'sql5031.smarterasp.net',
		connectionTimeout : 99000,
		requestTimeout : 99000,
		pool: {
	        max: 50,
	        min: 0,
	        idleTimeoutMillis: 30000
	    }
	}
}