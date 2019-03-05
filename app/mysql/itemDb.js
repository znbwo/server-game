var ItemDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

// 添加玩家道具数据
ItemDao.addPlayerItem = function (app, pid, itemId, num, cb) {
    var sql = 'call createPlayerItem(?,?,?)';
    var args = [pid, itemId, num];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = res;
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

// 更新玩家人物(英雄/兵)数据
ItemDao.updatePlayerItem = function (app, data, cb) {
    var sql = 'call updatePlayerItem(?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerItem ItemDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 获取玩家道具数据
ItemDao.getPlayerItem = function (app, pid, itemId, cb) {
    var sql = 'call getPlayerItem(?,?)';
    var args = [pid, itemId];
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