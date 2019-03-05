/*// mysql CRUD
 var sqlclient = module.exports;

 var _pool;

 var NND = {};

 *//*
 * Init sql connection pool
 * @param {Object} app The app for the server.
 *//*
 NND.init = function(app){
 _pool = require('./dao-pool').createMysqlPool(app);
 };

 *//**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} cb Callback function.
 *
 *//*
 NND.query = function(sql, args, cb){
 _pool.acquire(function(err, client) {
 if (!!err) {
 console.error('[sqlqueryErr] '+err.stack);
 return;
 }
 client.query(sql, args, function(err, res) {
 _pool.release(client);
 cb(err, res);
 });
 });
 };

 *//**
 * Close connection pool.
 *//*
 NND.shutdown = function(){
 _pool.destroyAllNow();
 };

 *//**
 * init database
 *//*
 sqlclient.init = function(app) {
 if (!!_pool){
 return sqlclient;
 } else {
 NND.init(app);
 sqlclient.insert = NND.query;
 sqlclient.update = NND.query;
 sqlclient.delete = NND.query;
 sqlclient.query = NND.query;
 return sqlclient;
 }
 };

 *//**
 * shutdown database
 *//*
 sqlclient.shutdown = function(app) {
 NND.shutdown(app);
 };*/


/**
 * 数据库模块
 */



// mysql CRUD
var sqlclient = module.exports;


/**
 // init database
 */
sqlclient.init = function (app) {
    if (!!this.pool) {
        return sqlclient;
    }
    else {
        var mysqlConfig = app.get('mysql')
        var options =
        {
            'host': mysqlConfig.gameData.host,
            'port': mysqlConfig.gameData.port,
            'user': mysqlConfig.gameData.user,
            'password': mysqlConfig.gameData.password,
            'database': mysqlConfig.gameData.database,
            'charset': mysqlConfig.gameData.charset,
            'connectionLimit': mysqlConfig.gameData.maxConnLimit,
            'supportBigNumbers': true,
            'bigNumberStrings': true
        };
        sqlclient.app = app;
        var mysql = require('../../node_modules/mysql');
        sqlclient.pool = mysql.createPool(options);
        return sqlclient;
    }
};

/*
 shutdown database
 */
sqlclient.shutdown = function (app) {
    this.pool.end(app);
};

/**
 * 执行查询
 */
sqlclient.execQuery = function (sql, values, cb) {
    this.pool.query(sql, values, cb);
};

