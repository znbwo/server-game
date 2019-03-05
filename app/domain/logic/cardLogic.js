var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var utils = require('../../util/utils');
var CardDb = require('../../mysql/cardDb');
var gameMgr = require('../gameData/gameMgr');
var CardData = require('../gameData/cardData');

var CardLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = CardLogic;

// 升级
CardLogic.prototype.upLevelCard = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var self = this;
    var uid = session.get('uid');
    var cardId = parseInt(msg['d'][0]);    //卡牌ID
    var cardLevel = parseInt(msg['d'][1]); //卡牌等级

    if(!cardId || !cardLevel){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    //静态数据检测
    var tempTbl = pGameMgr.TableCard['Card_' + cardId];
    //var tempData = (tempTbl == true) ? tempTbl.GetElement(cardLevel) : tempTbl;
    var tempData = pGameMgr.TableCard['Card_' + cardId].GetElement(cardLevel);
    console.log('tempData', tempData);
    if(!tempData){
        logger.info('配表招不到该卡牌升级数据', cardId);
        next(null, {code:code.CARD.FA_TBL_NOT_EXIST});
        return;
    }

    var costGold = tempData.getNum_Gold();
    var costCard = tempData.getNum_Card();
    var addUserExp = tempData.getExpGet_Master();

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code:code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code:code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var userGold = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY);

    var pCard = pPlayerR.getCard(cardId);
    if(!pCard){
        logger.info('玩家没有该卡牌', cardId);
        next(null, {code:code.CARD.FA_NOT_EXIST});
        return;
    }
    var userCardNum = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_NUM);
    var userCardLevel = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_LEVEL);
    var diffCardNum = userCardNum - costCard;

    if(diffCardNum < 0){
        logger.info('卡牌数量不足,不能升级', diffCardNum);
        next(null, {code:code.CARD.FA_CARD_NUM_NOT_ENOUGH});
        return;
    }
    var newCardLevel = userCardLevel + 1;

    //var tempNewData = tempTbl.GetElement(newCardLevel);
    var tempNewData = pGameMgr.TableCard['Card_' + cardId].GetElement(newCardLevel);
    if(!tempNewData){
        logger.info('卡牌级数已满', cardId);
        next(null, {code:code.CARD.FA_CARD_LEVEL_MAX});
        return;
    }

    //检测物品消耗
    if(costGold > userGold){
        logger.info('用户 %d ，金币不足', uid);
        next(null, {code:code.USER.FA_MONEY_NOT_ENOUGH});
        return;
    }
    //消耗金币成就
    pAchieveLogic.costGods(pPlayerR, costGold);
    pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, -costGold);
    //pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_CARDNUM, -costCard);

    pUserLogic.changeUserExp(uid, addUserExp);

    pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_LEVEL, newCardLevel);
    pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_NUM, diffCardNum);
    var dataArr = [pCard.getAttrib()];

    //存盘
    self.updataCard_DB(self, pCard, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        //发送客户端
        self.sendCardTo_C(uid, dataArr);
    })
    next(null, {code:code.OK, d:[cardId, newCardLevel]});
}

// 换位
CardLogic.prototype.replaceCard = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var cardGroup = parseInt(msg['d'][0]);    //卡组
    var cardIdOld = parseInt(msg['d'][1]);    //已上阵卡牌ID
    var cardIdNew = parseInt(msg['d'][2]);    //待上阵卡牌ID
    var cardPostion = parseInt(msg['d'][3]);  //卡牌位置 1.2.3.4 5.6.7.8

    if(!cardGroup || !cardIdOld || !cardIdNew || !cardPostion || cardIdOld == cardIdNew){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code:code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code:code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }

    var pCardGroup = pPlayerR.getCardGroup(cardGroup);
    if(!pCardGroup || !(pCardGroup.getAttrib().length)){
        logger.info('玩家没有该卡组', cardGroup);
        next(null, {code:code.CARD.FA_GROUP_NOT_EXIST});
        return;
    }

    var pCardOld = pPlayerR.getCard(cardIdOld);
    if(!pCardOld || !(pCardOld.getAttrib().length)){
        logger.info('玩家没有该旧卡牌', cardIdOld);
        next(null, {code:code.CARD.FA_NOT_EXIST});
        return;
    }

    var pCardNew = pPlayerR.getCard(cardIdNew);
    if(!pCardNew || !(pCardNew.getAttrib().length)){
        logger.info('玩家没有该新卡牌', cardIdNew);
        next(null, {code:code.CARD.FA_NOT_EXIST});
        return;
    }
    //验证旧卡牌是否在卡组里
    //var cardIndex = cardPostion + 2;
    var cardIndex = cardPostion;
    var curOldCardId = pCardGroup.getOneAttrib(cardPostion);
    if(curOldCardId !== cardIdOld){
        logger.info('旧卡牌不在该卡组里', cardIdOld);
        next(null, {code:code.CARD.FA_NOT_EXIST});
        return;
    }
    //验证新卡牌是否已在该卡组里
    var isInGroup = utils.contains(pCardGroup.getAttrib(), cardIdNew);
    if(isInGroup){
        logger.info('新卡牌已在该卡组里', cardIdNew);
        next(null, {code:code.CARD.FA_CARD_HAVE_IN_GROUP});
        return;
    }
    //更新卡组
    pCardGroup.setAttrib(cardIndex, cardIdNew);
    self.updataCardGroup_DB(self, pCardGroup, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        //发送客户端
        self.sendCardGroupTo_C(uid, [pCardGroup.getAttrib()]);
    })
    next(null, {code:code.OK});
}

// 保护
CardLogic.prototype.changeSaveCard = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var cardId = parseInt(msg['d'][0]);    //卡牌ID
    var newStatus = parseInt(msg['d'][1]); //卡牌保护状态 1未保护  2保护

    if(!cardId || !newStatus){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    //验证卡牌保护状态
    var isInArr = utils.contains(gameEnume.cardAttrib.CARD_ATTRIB_LOCK_STATUS_ARR, newStatus);
    if(!isInArr){
        logger.info('保护状态参数错误', newStatus);
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }
    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code:code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code:code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pCard = pPlayerR.getCard(cardId);
    if(!pCard || !(pCard.getAttrib().length)){
        logger.info('玩家没有该卡牌', pCard);
        next(null, {code:code.CARD.FA_NOT_EXIST});
        return;
    }
    //验证旧卡牌是否在卡组里
    var oldSaveStatus = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_ISLOCK);
    if(oldSaveStatus == newStatus){
        logger.info('玩家没有改变状态', newStatus);
        next(null, {code:code.CARD.FA_NOT_CHANGE_SAVE_STATUS});
        return;
    }
    //更新卡牌
    pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_ISLOCK, newStatus);
    self.updataCard_DB(self, pCard, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        //发送客户端
        self.sendCardTo_C(uid, [pCard.getAttrib()]);
    })
    next(null, {code:code.OK});
}

// 添加卡牌
CardLogic.prototype.addCardFunc= function (pPlayer, cardId, cardNum, cardLevel) {
    var pAchieveLogic = this.app.get('AchieveLogic');
    var self = this;
    var pid = pPlayer.getPid();
    var pCard = pPlayer.getCard(cardId);
    var uid = pPlayer.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    if(!pCard){
        pCard = new CardData();
        pCard.setAllAttrib([-1, pid, cardId, cardLevel, cardNum, 1]);

        pAchieveLogic.addCardKindNum(pPlayer, 1);
        pAchieveLogic.addCardsNum(pPlayer, cardNum);
    } else {
        pCard.changeCount(cardNum);
        pAchieveLogic.addCardsNum(pPlayer, cardNum);
    }
    //更新卡牌
    self.updataCard_DB(self, pCard, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        if(res[0][0].ECode === 0){
            pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_ID, res[0][0].OID);
            pPlayer.addCard(pCard);
        }
        //发送客户端
        self.sendCardTo_C(uid, [pCard.getAttrib()]);
    })
}

// 修改卡组
/*CardLogic.prototype.updateCardGroup = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var self = this;
    var uid = session.get('uid');
    var cardGroup = parseInt(msg['d'][0]);    //卡组

    if(!cardGroup){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code:code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code:code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var oldGroup = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_KGROUP);

    var pCardGroup = pPlayerR.getCardGroup(cardGroup);
    if(!pCardGroup || !(pCardGroup.getAttrib().length)){
        logger.info('玩家没有该卡组', cardGroup);
        next(null, {code:code.CARD.FA_GROUP_NOT_EXIST});
        return;
    }

    if(cardGroup == oldGroup){
        logger.info('已选中该卡组', cardGroup);
        next(null, {code:code.CARD.FA_GROUP_REPEAT});
        return;
    }

    //更新选中卡组
    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_KGROUP, oldGroup);
    pUserLogic.updataPlayerRole_DB(self, pPlayerR, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        //发送客户端
        pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
    })
    next(null, {code:code.OK});
}*/

CardLogic.prototype.randOneCardByType = function(){
    var gameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.thisName);
    var item = utils.getArrayRandomItems(gameConstantDataMgr.CardClassifyByType.slice(0), 1);
    var cardId = item[0].getID_Card();
    return cardId;
}

// 消耗卡牌 数量不能少于一张
CardLogic.prototype.reduceCard = function (self, pCardData, cb) {
    var data = pCardData.getAttrib();
    CardDb.updatePlayerCard(self.app, data, cb);
}

// 更新卡牌
CardLogic.prototype.updataCard_DB = function (self, pCardData, cb) {
    var data = pCardData.getAttrib();
    CardDb.updatePlayerCard(self.app, data, cb);
}

// 发送卡牌数据到客户端
CardLogic.prototype.sendCardTo_C = function (uid, dataArr) {
    var route = 'OnUpdataCard';
    var data = {d:dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

// 更新卡组
CardLogic.prototype.updataCardGroup_DB = function (self, pCardGroupData, cb) {
    var data = pCardGroupData.getAttrib();
    CardDb.updatePlayerCardGroup(self.app, data, cb);
}

// 添加卡组
CardLogic.prototype.addCardGroup_DB = function (self, CardGroupData, cb) {
    CardDb.addPlayerCardGroup(self.app, CardGroupData, cb);
}

// 发送卡组数据到客户端
CardLogic.prototype.sendCardGroupTo_C = function (uid, dataArr) {
    var route = 'OnUpdataCardGroup';
    var data = {d:dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
