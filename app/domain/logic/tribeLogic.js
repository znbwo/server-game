/**
 * Created by Administrator on 2017/2/13 0013.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../../util/utils');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var ShopDao = require('../../mysql/shopDb');
var ShopData = require('../gameData/shopData');
var async = require('async');


var TribeLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}
module.exports = TribeLogic;

TribeLogic.prototype.getTribeList = function (msg, session, next) {
    var uid = session.get('uid');
    var searchInfo = msg['d'][0];
    var searchResult = this._filterTribe(searchInfo);
    next(null, {code: code.OK, d: searchResult});
};

TribeLogic.prototype._filterTribe = function (info) {
    var tribeGameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.tribe);
    var tribeResult = [];
    if (info) {

    } else {

    }
    //TODO
    return tribeResult;
};

TribeLogic.prototype.getTribeList = function (msg, session, next) {
    var uid = session.get('uid');
    var searchInfo = msg['d'][0];
    var searchResult = this._filterTribe(searchInfo);
    next(null, {code: code.OK, d: searchResult});
};
//(创建、修改)
TribeLogic.prototype.editTribe = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = this.app.get('PublicLogic');
    var pUserData = pGameDataMgr.userMgr.getUser(uid);
    if (pUserData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUserData.getPlayerRoleData();
    if (pPlayerR == undefined) {
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pid = pPlayerR.getPid();
    var type = msg['d'][0];
    var icon = msg['d'][1];
    var name = msg['d'][2];
    var desc = msg['d'][3];
    var access = msg['d'][4]; //准入类型
    var arg = msg['d'][5];
    if (msg['d'].length != 6) {
        next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
        return;
    }

    next(null, {code: code.OK, d: []});
};

//(加入、退出、升降、踢出)
TribeLogic.prototype.baseHandler = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = this.app.get('PublicLogic');
    var pUserData = pGameDataMgr.userMgr.getUser(uid);
    if (pUserData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUserData.getPlayerRoleData();
    if (pPlayerR == undefined) {
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pid = pPlayerR.getPid();
    var type = msg['d'][0];
    var arg1 = msg['d'][1];
    var arg2 = msg['d'][2];
    if (msg['d'].length != 3) {
        next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
        return;
    }


    next(null, {code: code.OK, d: []});
};
TribeLogic.prototype.login = function (uid) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (!pGameDataMgr) {
        logger.error('TribeLogic.login pGameDataMgr is empty !');
        return;
    }
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.error('TribeLogic.login pUser is empty !');
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR ) {
        logger.error('userLogic.openPlayerPowerTimer pPlayerR is empty !');
        return;
    }
    var tribeId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.tribeId);
    if (tribeId) {
        this._changeOnLineNum(tribeId, 1);
        this.sendTribeToClient();
    }
};
TribeLogic.prototype.leave = function (uid) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (!pGameDataMgr) {
        logger.error('TribeLogic.login pGameDataMgr is empty !');
        return;
    }
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.error('TribeLogic.login pUser is empty !');
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR ) {
        logger.error('TribeLogic.login pPlayerR is empty !');
        return;
    }
    var tribeId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.tribeId);
    if (tribeId) {
        this._changeOnLineNum(tribeId, -1);
        this.sendTribeToClient(); //TODO
    }
};
TribeLogic.prototype._changeOnLineNum = function (tribeId, num) {
    var tribeGameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.tribe);
    if (!tribeGameConstantDataMgr) {
        logger.error('TribeLogic.changeOnLineNum tribeGameConstantDataMgr is empty !');
        return;
    }
    var tribe = tribeGameConstantDataMgr[tribeId];
    if (!tribe) {
        logger.error('TribeLogic._countOnLine tribe is not exist !');
        return;
    }
    if (!tribe[gameEnume.tribeAtt.onLineNum]) {
        tribe[gameEnume.tribeAtt.onLineNum] = 0;
    }
    var newNum = tribe[gameEnume.tribeAtt.onLineNum] + num;
    tribe[gameEnume.tribeAtt.onLineNum] = newNum < 0 ? 0 : newNum;
};
//登陆、变更推送
TribeLogic.prototype.sendTribeToClient = function (uid, dataArr) {
    var route = 'OnUpdataTribeInfo';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

