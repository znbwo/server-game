var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../../util/utils');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var BoxDao = require('../../mysql/boxDb');
var BoxData = require('../gameData/boxData');
var async = require('async');


var BoxLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = BoxLogic;
/**获得新宝箱位**/
function getNewPosition(pBoxMgr) {
    var newPosition = -1;
    for (var i = 1; i <= 4; i++) {
        if (!pBoxMgr[i]) {
            newPosition = i;
            break;
        }
    }
    return newPosition;
}
BoxLogic.prototype.addBox = function (pPlayerR, boxId, num) {
    if (num <= 0) {
        return false;
    }
    var self = this;
    var pid = pPlayerR.getPid();
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var newPosition = getNewPosition(pPlayerR.getBoxMgr());
    if (newPosition == -1) {
        return false;
    }
    var newBox = new BoxData();
    var data = [-1, pid, boxId, newPosition, 0];
    newBox.setAllAttrib(data);
    BoxDao.updatePlayerBox(this.app, data, function (err, res) {
        if (!err) {
            data[0] = res[0][0].OID;
            pPlayerR.addBox(newBox);
            num--;
            if (num > 0 && getNewPosition(pPlayerR.getBoxMgr()) != -1) {
                self.addBox(pPlayerR, boxId, num);
            } else {
                self.flushBoxesDataToClient(uid, pPlayerR.getBoxMgr());
            }
        }
    });
    return true;
};
/**
 * 获得宝箱奖励
 * @param pPlayerR
 * @param boxId
 */
BoxLogic.prototype.getBoxReward = function (pPlayerR, boxId) {
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var publicLogic = this.app.get('PublicLogic');
    var pGameMgr = this.app.get('gameMgr');
    var tableData = pGameMgr[gameEnume.tableNameEnume.TableTreasuerBoxInfo];
    if (tableData == undefined) {
        console.log('TableTreasuerBoxInfo is undefined from  getBoxReward()');
        return;
    }
    var boxDataInfo = tableData.Data()[boxId];
    if (boxDataInfo == undefined) {
        console.log('boxDataInfo is undefined from getBoxReward() with boxId :', boxId);
        return;
    }
    //新手引导
    if(boxId == 9999999){
        var result = this.getCurrency(boxDataInfo);
    } else {
        //计算出宝箱内容
        var goods = this.getCurrency(boxDataInfo); //(货币、卡券)
        var cards = this.getRandomCards(boxDataInfo);
        //变更玩家数据并推送给客户端玩家变更数据

        var result = goods.concat(cards);
    }

    //变更和同步玩家数据
    publicLogic.addGoods(pPlayerR, result, gameEnume.logTypeEnume.box);
    publicLogic.sendAddGoodsTo_C(uid, result, boxId);
    return result;
};
/**
 * 领取宝箱
 * @param msg
 * @param session
 * @param next
 */
BoxLogic.prototype.boxOpen = function (msg, session, next) {
    var self = this;
    var pGameMgr = self.app.get('gameMgr');
    var pGameDataMgr = self.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = self.app.get('PublicLogic');
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

    if (msg['d'].length != 2) {
        next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
        return;
    }
    var boxPosition = parseInt(msg['d'][0]);
    var openType = parseInt(msg['d'][1]);

    var pBoxData = pPlayerR.getBoxMgr()[boxPosition];
    if (pBoxData == undefined) {
        next(null, {code: code.BOX.FA_BOX_NO_EXIST});
        return;
    }
    var boxId = pBoxData.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_BID);
    var boxTableData = pGameMgr[gameEnume.tableNameEnume.TableTreasuerBoxInfo];
    if (boxTableData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var boxDataInfo = boxTableData.Data()[boxId];
    if (boxDataInfo == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }

    if (openType == 1) {//钻石开启
        if(boxId != 9999999){
            //校验钻石数、扣除钻石
            var needDiamond = calculateDiamond(boxDataInfo, pBoxData, pGameMgr);
            var have = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND);
            if (needDiamond > have) {
                next(null, {code: code.BOX.FA_BOX_NO_enough_Diamond});
                return;
            } else {
                pUserData.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND, have - needDiamond);
                publicLogic.costGoods(pPlayerR, uid, gameEnume.GoodsCostTypeTbl.Type_Diamond, needDiamond, gameEnume.logTypeEnume.boxReduce);
            }
        }

    } else {//校验时间
        var needMinute = boxDataInfo.getTime_Open_Treasure();
        var passedMinute = (utils.getCurrTime() - pBoxData.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME)) / 60;
        if (passedMinute < needMinute) {
            next(null, {code: code.BOX.FA_BOX_NO_FINISH_COUNT_DOWN});
            return;
        }
    }
    //清除宝箱
    BoxDao.delPlayerBox(self.app, pid, boxPosition, function () {
        pPlayerR.removeBox(pBoxData);
        self.flushBoxesDataToClient(uid, pPlayerR.getBoxMgr());
    });
    //宝箱数据同步
    self.getBoxReward(pPlayerR, boxId);
    //协议返回宝箱内容
    next(null, {code: code.OK, d: []});
}
BoxLogic.prototype.flushBoxesDataToClient = function (uid, pBoxMgr) {
    var data = [];
    for (var i in pBoxMgr) {
        var box = pBoxMgr[i];
        data.push([box.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_POSITION), box.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_BID), box.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME)])
    }
    this.sendBoxDataToClient(uid, data);
}

function calculateDiamond(boxDataInfo, pBoxData, pGameMgr) {
    var needMinute = boxDataInfo.getTime_Open_Treasure();//为0也正确
    var minutesOfOneDaimond = pGameMgr.TableConstant.Data()[gameEnume.constant.minuteOfOneDaimond].getValue_Constant();
    if (pBoxData.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME) == 0) {//未开启倒计时
        return Math.ceil(needMinute / minutesOfOneDaimond);
    } else {
        var passedMinute = ( utils.getCurrTime() - pBoxData.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME)) / 60;
        var minuteGap = needMinute - passedMinute;
        return Math.ceil(minuteGap / minutesOfOneDaimond);
    }
}
/**
 * 宝箱倒计时开启
 * @param msg
 * @param session
 * @param next
 */
BoxLogic.prototype.boxCountdown = function (msg, session, next) {
    var self = this;
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var pUserLogic = this.app.get('UserLogic');
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
        next(null, {code: code.SERVER.FA_SHOP_Client_ARG_ERR});
        return;
    }
    var boxPosition = parseInt(msg['d'][0]);

    var pBoxData = pPlayerR.getBoxMgr()[boxPosition];
    if (pBoxData == undefined) {
        next(null, {code: code.BOX.FA_BOX_NO_EXIST});
        return;
    }
    var isNew = (pBoxData.getOneAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME) == 0);
    if (!isNew) {
        next(null, {code: code.BOX.FA_BOX_CANT_OPEN_AGAIN});
        return;
    }
    pBoxData.setAttrib(gameEnume.boxAttrib.BOX_ATTRIB_UNLOCKTIME, utils.getCurrTime());
    //宝箱数据同步
    BoxDao.updatePlayerBox(self.app, pBoxData.getAttrib(), function () {
        self.flushBoxesDataToClient(uid, pPlayerR.getBoxMgr());
    });
    // //玩家数据同步
    // pUserLogic.updataPlayerRole_DB(self, pPlayerR, function (err, res) {
    //     pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
    // });
    next(null, {code: code.OK});
    return;

};

// 根据常规关卡胜利次数 返回宝箱ID
BoxLogic.prototype.getBoxIdByVicNumFunc = function (pPlayerR, newSumVicNum, cityId) {
    var pGameMgr = this.app.get('gameMgr');

    var tempCount = pGameMgr.TableTreasuerBoxDrop.Count();
    var dropId = newSumVicNum > tempCount ? newSumVicNum % tempCount : newSumVicNum;
    console.log('dropId', dropId);
    var pDropTreaBoxTable = pGameMgr.TableTreasuerBoxDrop.GetElement(dropId);
    var boxType = pDropTreaBoxTable.getType_Treasure();
    var tempBoxInfoData = pGameMgr.TableTreasuerBoxInfo.Data();
    var boxId = false;
    for (var item in tempBoxInfoData) {
        var bigGuanId = tempBoxInfoData[item].getID_RoundBig();
        var boxRewardType = tempBoxInfoData[item].getType_Treasure();
        if (cityId == bigGuanId && boxType == boxRewardType) {
            boxId = item;
        }
    }
    return boxId;
}

/**
 * 获得物资
 * @param boxDataInfo
 * @returns {Array}
 */
BoxLogic.prototype.getCurrency = function (boxDataInfo) {
    //金币、钻石、挑战券[1,2,10],[2,5,10]
    var curArr = boxDataInfo.getCurrency();
    var afterCurArr = [];
    for (var i = 0; i < curArr.length; i++) {
        var item = curArr[i];
        var start = item['_Value2'];
        var end = item['_Value3'];
        if (start == undefined || end == undefined) {
            break;
        }
        var result = utils.randomNumBetweenWithBorder(start, end);
        var newItem = [];
        newItem[0] = item['_Value1'];
        newItem[1] = result;
        afterCurArr.push(newItem);
    }
    return afterCurArr;
}

BoxLogic.prototype.getRandomCards = function (boxDataInfo) {
    var result = [];
    //随机次数，卡牌总数
    var bigRound = boxDataInfo.getID_RoundBig();
    var gameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.thisName);
    if (boxDataInfo.getRoundNum_Card_Common().length > 1) {
        var maxRepeat = boxDataInfo.getRoundNum_Card_Common()[0]; //随机最大次数
        var cardMaxNum = boxDataInfo.getRoundNum_Card_Common()[1];//需要随机卡牌数
        var typeCards = this.getCardsByOpenRound(gameConstantDataMgr.CommonCardByOpenLevel, bigRound).slice(0);
        var CommonCard = getRandomCardFunction(maxRepeat, cardMaxNum, typeCards);
        result = result.concat(CommonCard);
    }

    if (boxDataInfo.getRoundNum_Card_Rare().length > 1) {
        var maxRepeat = boxDataInfo.getRoundNum_Card_Rare()[0]; //随机最大次数
        var cardMaxNum = boxDataInfo.getRoundNum_Card_Rare()[1];//需要随机卡牌数
        var typeCards = this.getCardsByOpenRound(gameConstantDataMgr.RareCardByOpenLevel, bigRound).slice(0);
        var RareCard = getRandomCardFunction(maxRepeat, cardMaxNum, typeCards);
        result = result.concat(RareCard);
    }
    if (boxDataInfo.getRoundNum_Card_Epic().length > 1) {
        var maxRepeat = boxDataInfo.getRoundNum_Card_Epic()[0]; //随机最大次数
        var cardMaxNum = boxDataInfo.getRoundNum_Card_Epic()[1];//需要随机卡牌数
        var typeCards = this.getCardsByOpenRound(gameConstantDataMgr.EpicCardByOpenLevel, bigRound).slice(0);
        var EpicCard = getRandomCardFunction(maxRepeat, cardMaxNum, typeCards);
        var extra = utils.getRandNum(100) < boxDataInfo.getRoundExtraNum_Card_Epic();
        if (extra) {
            EpicCard = EpicCard.concat(getRandomCardFunction(1, 1, typeCards));
        }
        result = result.concat(EpicCard);
    }
    if (boxDataInfo.getRoundNum_Card_Legendary().length > 1) {
        var maxRepeat = boxDataInfo.getRoundNum_Card_Legendary()[0]; //随机最大次数
        var cardMaxNum = boxDataInfo.getRoundNum_Card_Legendary()[1];//需要随机卡牌数
        var typeCards = this.getCardsByOpenRound(gameConstantDataMgr.LegendaryCardByOpenLevel, bigRound).slice(0);
        var LegendaryCard = getRandomCardFunction(maxRepeat, cardMaxNum, typeCards);
        var extra = utils.getRandNum(100) < boxDataInfo.getRoundExtraNum_Card_Legendary();
        if (extra) {
            LegendaryCard = LegendaryCard.concat(getRandomCardFunction(1, 1, typeCards));
        }
        result = result.concat(LegendaryCard);
    }
    return result;
}
BoxLogic.prototype.getCardsByOpenRound=function(typeCards, bigRoundId) {
    var result = [];
    for (var i = 1; i <= bigRoundId; i++) {
        if (typeCards[i] != undefined) {
            result = result.concat(typeCards[i]);
        }
    }
    return result;
}
/**
 *
 * @param maxRepeat 随机最大次数
 * @param cardMaxNum 需要随机卡牌数
 * @param typeCardArr gameConstantDataMgr 中某一类型的卡牌
 * @returns {Array}
 */
function getRandomCardFunction(maxRepeat, cardMaxNum, typeCardArr) {
    var resultArr = [];
    //新建一个数组,将传入的数组复制过来,用于运算,而不要直接操作传入的数组;
    //var typeCardArr = typeCardArr.slice(0);//　获取特定品质卡牌数组
    for (var i = 0; i < maxRepeat; i++) {
        var curNum = utils.randomNumBetweenWithBorder(1, cardMaxNum);//本次随机要随机的卡牌数量
        //最后一次循环应把剩余卡牌全随机出来
        if (i == (maxRepeat - 1)) {
            curNum = cardMaxNum;
        }
        var itemResultArr = utils.getArrayRandomItems(typeCardArr, 1); //随机出来的卡牌
        if (itemResultArr.length > 0) {
            resultArr.push([itemResultArr[0].getID_Card(), curNum]);
        }
        cardMaxNum -= curNum;
        if (cardMaxNum == 0) {
            break;
        }
    }
    return resultArr;
}
BoxLogic.prototype.sendBoxDataToClient = function (uid, dataArr) {
    var route = 'OnUpdataBox';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
