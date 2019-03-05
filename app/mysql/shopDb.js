var ShopDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');


//INSERT INTO shop_card(CID) VALUES (100),(100),(100);
ShopDao.insertShopCard = function (app, data, cb) {
    var sql = 'insert into shop_card (roundId,CID,num,price) values  ' + data + ';';
    var args = [];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('insertShopCard ShopDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
//getCardShop
ShopDao.getCardShop = function (app, cb) {
    var sql = 'call getCardShop()';
    var args = [];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0) {
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for (var i = 0; i < res[0].length; i++) {
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}
ShopDao.emptyCardShop = function (app, cb) {
    var sql = 'delete from shop_card  ';
    var args = [];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('emptyCardShop ShopDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
ShopDao.getPlayerShop = function (app, pid, cb) {
    var sql = 'call getPlayerShopByPid(?)';
    var args = [pid];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0) {
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for (var i = 0; i < res[0].length; i++) {
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

ShopDao.emptyPlayerShop = function (app, cb) {
    var sql = 'delete from player_shop  ';
    var args = [];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('emptyPlayerShop ShopDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
ShopDao.updatePlayerNoteRoundIdFromBigRound = function (app, cb) {
    var sql = 'update player_note set roundId = bigRound ';
    var args = [];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerNoteRoundIdFromBigRound ShopDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
// 修改或新增
ShopDao.updatePlayerShop = function (app, data, cb) {
    var sql = 'call updatePlayerShop(?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (!!err) {
            logger.error('updatePlayerShop ShopDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}




