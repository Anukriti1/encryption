module.exports = {
	
	db: {
		type : 'mssql',
		username : 'DB_A0B3E1_ionicdb_admin' ,
		password : 'testing123',
		database_name : 'DB_A0B3E1_ionicdb',
		host : 'SQL5023.Smarterasp.net',
		connectionTimeout : 99000,
		requestTimeout : 99000,
		pool: {
	        max: 50,
	        min: 0,
	        idleTimeoutMillis: 30000
	    }
	}
}