var buildDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

// 更新玩家建筑数据
buildDao.updatePlayerBuildBasic = function (app, data, cb) {
    var sql = 'call updatePlayerBuild(?,?,?,?,?,?)';
    var args = data;
    console.log('args', args);
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerBuildBasic buildDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 获取玩家建筑数据
buildDao.getPlayerBuildByPid = function (app, pid, cb) {
    var sql = 'call getPlayerBuildByPid(?)';
    var args = [pid];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for(var i = 0; i < res[0].length; i++){
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

// 获取玩家建筑生产队列数据
buildDao.getPlayerBuildProdQueueByPid = function (app, pid, cb) {
    var sql = 'call getBuildProdQueueByPid(?)';
    var args = [pid];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for(var i = 0; i < res[0].length; i++){
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

// 更新玩家建筑生产队列数据
buildDao.updatePlayerBuildProduceQueue = function (app, data, cb) {
    var sql = 'call updateBuildProduceQueue(?,?,?,?,?,?)';
    var args = data;
    console.log('args', args);
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerBuildProduceQueue buildDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}