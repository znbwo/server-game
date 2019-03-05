var AchieveDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

AchieveDao.getPlayerAchieveByPid = function(app,pid,cb) {
    var sql = 'call getPlayerAchieveByPid(?)';
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


AchieveDao.updatePlayerAchieve = function (app, data, cb) {
    var sql = 'call updatePlayerAchieve(?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerAchieve AchieveDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

AchieveDao.getPlayerNoteByPid = function(app,pid,cb) {
    var sql = 'call getPlayerNoteByPid(?)';
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

AchieveDao.updatePlayerNote = function (app, data, cb) {
    var sql = 'call updatePlayerNote(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';//16
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerNote AchieveDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}


