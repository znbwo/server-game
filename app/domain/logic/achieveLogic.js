var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../../util/utils');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var AchieveDao = require('../../mysql/achieveDb');
var AchieveData = require('../gameData/achieveData');
var async = require('async');


var AchieveLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = AchieveLogic;
AchieveLogic.prototype.achieveTrigger = function (pPlayerR, type, num) {
    switch (type) {
        case gameEnume.achieveTypeEnume.addBigRound:
            this.addBigRound(pPlayerR);
            break;
        case gameEnume.achieveTypeEnume.addNormal:
            this.addNormal(pPlayerR);
            break;
        case gameEnume.achieveTypeEnume.addLimit:
            this.addLimit(pPlayerR);
            break;
        case gameEnume.achieveTypeEnume.addCardKindNum:
            this.addCardKindNum(pPlayerR, num);
            break;
        case gameEnume.achieveTypeEnume.addCardsNum:
            this.addCardsNum(pPlayerR, num);
            break;
        case gameEnume.achieveTypeEnume.addGods:
            this.addGods(pPlayerR, num);
            break;
        case gameEnume.achieveTypeEnume.addPlayerLevel:
        case gameEnume.achieveTypeEnume.costGods:
            this.costGods(pPlayerR, num);
            break;
    }
};
/**
 * 常规通关
 * @param pPlayerR
 */
AchieveLogic.prototype.addNormal = function (pPlayerR) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_normalNum);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_normalNum, ++oldNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 限时通关
 * @param pPlayerR
 */
AchieveLogic.prototype.addLimit = function (pPlayerR) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_limitNum);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_limitNum, ++oldNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 章节解锁
 * @param pPlayerR
 */
AchieveLogic.prototype.addBigRound = function (pPlayerR) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_bigRound);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_bigRound, ++oldNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 获得金币
 * @param pPlayerR
 * @param addNum
 */
AchieveLogic.prototype.addGods = function (pPlayerR, addNum) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_addGods);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_addGods, oldNum + addNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 消耗金币
 * @param pPlayerR
 * @param costNum
 */
AchieveLogic.prototype.costGods = function (pPlayerR, costNum) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_costGods);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_costGods, oldNum + costNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 增加获得卡牌数
 * @param pPlayerR
 * @param addNum
 */
AchieveLogic.prototype.addCardsNum = function (pPlayerR, addNum) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_gotCardsNum);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_gotCardsNum, oldNum + addNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}
/**
 * 获得获得卡牌种类
 * @param pPlayerR
 * @param addNum
 */
AchieveLogic.prototype.addCardKindNum = function (pPlayerR, addNum) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardKindNum);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardKindNum, oldNum + addNum);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    this.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
}

/**
 * 领取成就
 * @param msg
 * @param session
 * @param next
 */
AchieveLogic.prototype.applyAchieve = function (msg, session, next) {
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

    if (msg['d'].length != 1) {
        next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
        return;
    }
    var achieveId = parseInt(msg['d'][0]);

    var pAchieveData = pPlayerR.getAchieveMgr()[achieveId];
    if (pAchieveData != undefined) {//已领
        next(null, {code: code.ACHIEVE.FA_ACHIEVE_TOKE_ALREADY});
        return;
    }

    var tableData = pGameMgr[gameEnume.tableNameEnume.TableAchievement];
    if (tableData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var achieveDataInfo = tableData.Data()[achieveId];
    if (achieveDataInfo == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var achieveType = achieveDataInfo.getType_Achievement();
    var needNum = achieveDataInfo.getArgument();
    var achieveAward = achieveDataInfo.getAward_Achievement();
    var pNum = -1;
    switch (achieveType) {//1=解锁第N个大关卡 2=常规通关数达到N次 3=限时通关数达到N次 4=收集到N种卡牌 5=收集到N张卡牌 6=获得N个金币 7=角色达到N级 8=消耗N个金币
        case 1://解锁第N个大关卡
            // var tableData = pGameMgr[gameEnume.tableNameEnume.TableRound_Small];
            // if (tableData == undefined) {
            //     next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
            //     return;
            // }
            // var tableDataInfo = tableData.Data()[pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN)];
            // if (tableDataInfo == undefined) {
            //     next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
            //     return;
            // }
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_bigRound);
            break;
        case 2://常规通关数达到N次
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_normalNum);
            break;
        case 3://限时通关数达到N次
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_limitNum);
            break;
        case 4://收集到N种卡牌
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardKindNum);
            break;
        case 5://收集到N张卡牌
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_gotCardsNum);
            break;
        case 6://获得N个金币
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_addGods);
            break;
        case 7://角色达到N级
            pNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            break;
        case 8://消耗N个金币
            pNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_costGods);
            break;
    }
    if (pNum == -1) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    if (pNum < needNum) {
        next(null, {code: code.ACHIEVE.FA_ACHIEVE_NO_FINISH});
        return;
    }
    //成就
    var newAchieve = new AchieveData();
    newAchieve.setAttrib(gameEnume.achieveAttrib.ACH_ATTRIB_ID, -1);
    newAchieve.setAttrib(gameEnume.achieveAttrib.ACH_ATTRIB_PID, pid);
    newAchieve.setAttrib(gameEnume.achieveAttrib.ACH_ATTRIB_AID, achieveId);
    AchieveDao.updatePlayerAchieve(this.app, newAchieve.getAttrib(), function (err, res) {
    });
    pPlayerR.addAchieve(newAchieve);
    this.flushGotAchieveDataToClient(uid, pPlayerR.getAchieveMgr());
    var award = [];
    for (var i = 0; i < achieveAward.length; i++) {
        var item = achieveAward[i];
        var tyId = item['_Value1'];
        var num = item['_Value2'];
        if (tyId == undefined || num == undefined) {
            break;
        }
        award.push([tyId, num]);
    }
    publicLogic.addGoods(pPlayerR, award, gameEnume.logTypeEnume.achieve);//玩家数据同步和存库
    next(null, {code: code.OK, d: [achieveId]});
}

AchieveLogic.prototype.updatePlayerNote = function (app, data, cb) {
    AchieveDao.updatePlayerNote(app, data, cb);
}
AchieveLogic.prototype.updateSpecialPlayerNote_DB = function (app, pPlayerRole, json, cb) {
    var dataCopy = pPlayerRole.getNoteAttrib().slice();
    for (var key in json) {
        var index = parseInt(key);
        dataCopy[index] = json[key];
    }
    AchieveDao.updatePlayerNote(app, dataCopy, cb);
}

//已领取成就信息推送{"d":[id,id,id]}
AchieveLogic.prototype.flushGotAchieveDataToClient = function (uid, pAchieveMgr) {
    var data = [];
    for (var i in pAchieveMgr) {
        var achieveId = pAchieveMgr[i].getOneAttrib(gameEnume.achieveAttrib.ACH_ATTRIB_AID);
        data.push(achieveId);
    }
    this.sendGotAchieveToClient(uid, data);
}
AchieveLogic.prototype.flushAchieveNoteDataToClient = function (uid, pNoteAttrib) {
    this.sendAchieveNoteToClient(uid, pNoteAttrib.slice(2));
}

AchieveLogic.prototype.sendGotAchieveToClient = function (uid, dataArr) {
    var route = 'OnUpdataGotAchieve';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
AchieveLogic.prototype.sendAchieveNoteToClient = function (uid, dataArr) {
    var route = 'OnUpdataAchieveNote';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

AchieveLogic.prototype.newPlayerGuaidNote = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
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

    if (msg['d'].length != 1) {
        next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
        return;
    }
    var newGuaidNoteId = msg['d'][0];
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_newPlayerGuide, newGuaidNoteId);
    AchieveDao.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
    });
    next(null, {code: code.OK});
};

