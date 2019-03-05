var CardDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

// 更新玩家卡牌数据
CardDao.updatePlayerCard = function (app, data, cb) {
    var sql = 'call updatePlayerCard(?,?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerCard CardDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 获取玩家卡牌数据
CardDao.getPlayerCardByPid = function (app, pid, cb) {
    var sql = 'call getPlayerCardByPid(?)';
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

// 更新玩家卡牌组数据
CardDao.updatePlayerCardGroup = function (app, data, cb) {
    console.log('args', data);
    var sql = 'call updatePlayerCardGroup(?,?,?,?,?,?,?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerCardGroup CardDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 添加玩家卡牌组数据
CardDao.addPlayerCardGroup = function (app, data, cb) {
    console.log('args', data);
    var sql = 'call addPlayerCardGroup(?,?,?,?,?,?,?,?,?,?,?)';
    var args = data;
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


// 获取玩家卡组数据
CardDao.getPlayerCardGroupByPid = function (app, pid, cb) {
    var sql = 'call getPlayerCardGroupByPid(?)';
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