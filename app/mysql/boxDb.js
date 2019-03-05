var BoxDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

BoxDao.getPlayerBox = function(app,pid,cb) {
    var sql = 'call getPlayerBoxByPid(?)';
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

BoxDao.delPlayerBox = function (app,pid,position, cb) {
    var sql = 'delete from player_box where PID = ? and position = ?  ';
    var args = [pid,position];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('delPlayerBox BoxDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 修改或新增（新增将邮件id设为负数）
BoxDao.updatePlayerBox = function (app, data, cb) {
    var sql = 'call updatePlayerBox(?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerBox BoxDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}


