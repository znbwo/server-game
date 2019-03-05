var BaseDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

// 更新玩家基地数据
BaseDao.updatePlayerBase = function (app, data, cb) {
    var sql = 'call updatePlayerBase(?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerBase BaseDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 获取玩家基地数据
BaseDao.getPlayerBaseByPid = function (app, pid, cb) {
    var sql = 'call getPlayerBaseByPid(?)';
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