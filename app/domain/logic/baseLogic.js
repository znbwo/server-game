var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var utils = require('../../util/utils');
var BaseDb = require('../../mysql/baseDb');
var BaseData = require('../gameData/baseData');

var BaseLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = BaseLogic;

// 升级
BaseLogic.prototype.upLevelBase = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var pCardLogic = this.app.get('CardLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var self = this;
    var uid = session.get('uid');
    var baseId = parseInt(msg['d'][0]);    //基地ID
    var baseLevel = parseInt(msg['d'][1]); //基地等级
    var cardArr = msg['d'][2];             //卡牌数组 [["卡牌ID", "卡牌数量"]]

    if (!baseId || !baseLevel || !utils.isArray(cardArr) || cardArr.length < 1) {
        logger.info('参数错误');
        next(null, {code: code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    //静态数据检测
    var tempData = pGameMgr.TableCard['Card_' + baseId].GetElement(baseLevel);
    if (!tempData) {
        logger.info('配表找不到该卡牌升级数据', baseId);
        next(null, {code: code.BASE.FA_TBL_NOT_EXIST});
        return;
    }
    var costGold = tempData.getNum_Gold();

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
    var userGold = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY);

    var pBase = pPlayerR.getBase();
    var userBid = pBase.getOneAttrib(gameEnume.baseAttrib.BASE_ATTRIB_BID);
    var oldLevel = pBase.getOneAttrib(gameEnume.baseAttrib.BASE_ATTRIB_LEVEL);
    if (!pBase || pBase.length < 1 || userBid != baseId || oldLevel != baseLevel) {
        logger.info('用户 %d没有基地信息', pBase);
        next(null, {code: code.BASE.FA_NOT_EXIST});
        return;
    }
    var oldExp = pBase.getOneAttrib(gameEnume.baseAttrib.BASE_ATTRIB_EXP);
    var nextLevel = oldLevel + 1;
    //主基地等级不能高于玩家等级
    if (nextLevel > userLevel) {
        logger.info('基地等级不能高于玩家等级', nextLevel);
        next(null, {code: code.BASE.FA_BASE_LEVEL_MAX});
        return;
    }

    //检测卡牌消耗 并累加提供经验值
    var sumExp = 0;
    var sumCardNum = 0;
    for (var i in cardArr) {
        var cardId = cardArr[i][0];
        var cardNum = cardArr[i][1];
        var pCard = pPlayerR.getCard(cardId);
        if (!pCard) {
            logger.info('玩家没有该卡牌', cardId);
            next(null, {code: code.CARD.FA_NOT_EXIST});
            return;
        }
        var userCardNum = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_NUM);
        var lockStatus = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_ISLOCK);
        if (userCardNum <= 1) {
            logger.info('卡牌数量不足,不能升级', userCardNum);
            next(null, {code: code.CARD.FA_CARD_NUM_NOT_ENOUGH});
            return;
        }
        if (lockStatus == 2) {
            logger.info('卡牌被保护中不能被消耗', cardId, lockStatus);
            next(null, {code: code.CARD.FA_CARD_HAVE_SAVEING});
            return;
        }

        var tempCardData = pGameMgr.TableCardBaseInfo.GetElement(cardId);
        var addBaseExp = tempCardData.getExpGet_Tower();
        if (typeof (addBaseExp) != "number" || addBaseExp < 0) {
            logger.info('填表错误', addBaseExp);
            next(null, {code: code.BASE.FA_TBL_ADD_BASE_EXP_ERROR});
            return;
        }
        sumCardNum += cardNum;
        sumExp += (addBaseExp * cardNum);
    }
    //升级逻辑
    var newExp = oldExp + sumExp;

    var nextExp = tempData.getExpCost_Tower();
    var addLevel = 0
    if (nextExp > 0 && newExp >= nextExp) {
        addLevel++;
        newExp = 0;//newExp - nextExp;
    }
    if(addLevel > 0){
        //检测物品消耗
        if (costGold > userGold) {
            logger.info('用户 %d ，金币不足', uid);
            next(null, {code: code.USER.FA_MONEY_NOT_ENOUGH});
            return;
        } else {
            //更新玩家信息
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, -costGold);
            //消耗金币成就
            pAchieveLogic.costGods(pPlayerR, costGold);
            pUserLogic.updataPlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                //存盘
                //发送客户端
                pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
            })
        }
    }
    //pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_CARDNUM, -sumCardNum);

    //更新消耗卡牌
    async.mapSeries(cardArr, function (k, callback) {
        var cardId = cardArr[i][0];
        var cardNum = cardArr[i][1];
        var pCard = pPlayerR.getCard(cardId);
        pCard.changeCount(-cardNum);
        //存盘
        pCardLogic.updataCard_DB(self, pCard, function (err, res) {
            if (!!err) {
                next(null, {code: code.SERVER.FA_DB_ERROR});
                return;
            }
            //发送客户端
            pCardLogic.sendCardTo_C(uid, [pCard.getAttrib()]);
            callback();
        })
    }, function () {
    })


    var curLevel = oldLevel + addLevel;
    pBase.setAttrib(gameEnume.baseAttrib.BASE_ATTRIB_EXP, newExp);
    if (addLevel > 0) {
        pBase.setAttrib(gameEnume.baseAttrib.BASE_ATTRIB_LEVEL, curLevel);
    }
    //存盘
    self.updataBase_DB(self, pBase, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        //发送客户端
        self.sendBaseTo_C(uid, pBase);
    })
    next(null, {code: code.OK, d:[userBid, curLevel]});
}

// 更新卡牌
BaseLogic.prototype.updataBase_DB = function (self, pBaseData, cb) {
    var data = pBaseData.getAttrib();
    BaseDb.updatePlayerBase(self.app, data, cb);
}

// 发送数据到客户端
BaseLogic.prototype.sendBaseTo_C = function (uid, pBase) {
    var route = 'OnUpdataBase';
    var data = {d: pBase.getAttrib()};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}