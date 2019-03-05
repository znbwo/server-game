var guanKaDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');
var prefix = {
    "zoneList": "zoneList:",                // 服务器分区前缀
    "genSumRank": "user:sumGeneralScore",   // 常规总积分
    "limSumRank": "user:sumLimitScore",     // 限时总积分
    "sumRank": "user:sumScore",             // 总积分
}
// 获取玩家关卡数据
guanKaDao.getPlayerGuanQiaByPid = function (app, pid, cb) {
    var sql = 'call getPlayerGuankaByPid(?)';
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

// 更新玩家关卡数据
guanKaDao.updatePlayerGuanka = function (app, data, cb) {
    var sql = 'call updatePlayerGuanka(?,?,?,?,?,?,?,?,?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerGuanka guankaDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 24Guanka
guanKaDao.update24Guanka = function (app, cb) {
    var sql = 'call 24GuanKa()';
    var args = '';
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerGuanka guankaDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}