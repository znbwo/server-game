var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var noteLogger = require('pomelo/node_modules/pomelo-logger').getLogger('note');
var CardData = require('../gameData/cardData');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var CacheDb = require('../../redis/cacheDb');
var UserDb = require('../../mysql/userDb');
var MailDb = require('../../mysql/mailDb');
var GuankaDb = require('../../mysql/guanKaDb');
var utils = require('../../util/utils');
var PublicLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');// 消息发送模块
}

module.exports = PublicLogic;


PublicLogic.prototype.test = function () {
    console.log('this is a test');
}
PublicLogic.prototype.addOneNoteLog = function (uid, type, sourceType, num) {
    var data = sourceType + ',' + num;
    var time = utils.getMicTime();
    // noteLogger.info(uid, type, data, time);
}
PublicLogic.prototype.addNoteLogs = function (uid, type, data) {
    var source = '';
    for (var i = 0; i < data.length; i++) {
        source += data[i][0] + ',';
        source += data[i][1];
        if (i != data.length - 1) {
            source += ':';
        }
    }
    var time = utils.getMicTime();
    // noteLogger.info(uid, type, source, time);
}
PublicLogic.prototype.addItem = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    var pCardLogic = this.app.get('CardLogic');
    var pUserLogic = this.app.get('UserLogic');
    var pBoxLogic = this.app.get('BoxLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');

    var uid = session.get('uid');
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    var pPlayerR = pUser.getPlayerRoleData();
    var pid = pPlayerR.getPid();


    var shopType = parseInt(msg['d'][0]);
    var shopId = parseInt(msg['d'][1]);
    var num = parseInt(msg['d'][2]);
    if (num == 0) {
        next(null, {code: code.OK, d: []});
        return;
    }
    var self = this;
    //
    self.addOneNoteLog(uid, gameEnume.logTypeEnume.gmChange, shopId, num);
    switch (shopType) {
        case gameEnume.GoodsAddTypeTbl.Type_Money://金币
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, num);
            pAchieveLogic.addGods(pPlayerR, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_Diamond://钻石
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_MONEY_TICKET://金币关卡入场券
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_RAND_TICKET://随机关卡入场券
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_PLAYER_EXP://人物的经验
            pUserLogic.changeUserExp(uid, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_PLAYER_MEDAL://勋章
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL, num);
            break;
        case gameEnume.GoodsAddTypeTbl.Type_PLAYER_CARD://卡牌
            var cardId = shopId;
            var tableData = pGameMgr[gameEnume.tableNameEnume.TableCardBaseInfo];
            if (tableData == undefined) {
                logger.info('卡牌信息静态表不存在');
                break;
            }
            if (tableData.GetElement(cardId) == undefined) {
                logger.info('卡牌 %d不存在', cardId);
                break;
            }
            var cardNum = num;
            var pCard = pPlayerR.getCard(cardId);
            if (pCard == undefined) {
                pCard = new CardData();
                pCard.setAllAttrib([-1, pid, cardId, 1, cardNum, 1]);
                pPlayerR.addCard(pCard);
                pAchieveLogic.addCardKindNum(pPlayerR, 1);
                pAchieveLogic.addCardsNum(pPlayerR, cardNum);
            } else {
                var oldNum = pCard.getAttrib()[gameEnume.cardAttrib.CARD_ATTRIB_NUM];
                pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_NUM, oldNum + cardNum);
                pAchieveLogic.addCardsNum(pPlayerR, cardNum);
            }
            pCardLogic.updataCard_DB(self, pCard, function (err, res) {
                pCardLogic.sendCardTo_C(uid, [pCard.getAttrib()])
            });
            break;
        case gameEnume.GoodsAddTypeTbl.Type_PLAYER_BOX://宝箱
            var tableData = pGameMgr[gameEnume.tableNameEnume.TableTreasuerBoxInfo];
            if (tableData == undefined) {
                logger.info('宝箱信息静态表不存在');
                break;
            }
            if (tableData.GetElement(shopId) == undefined) {
                logger.info('宝箱 %d不存在', shopId);
                break;
            }
            pBoxLogic.addBox(pPlayerR, shopId, num);
            break;

    }
    //存盘
    pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
        //发送客户端
        pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
    });
    next(null, {code: code.OK, d: []});
    return;
};


// 奖励 开礼包
/*PublicLogic.prototype.gameReward = function (uid, itemGroupId) {
 var pGameMgr = this.app.get('gameMgr');
 var pGameDataMgr = this.app.get('gameDataMgr');
 if (pGameMgr == undefined || pGameDataMgr == undefined) {
 return false;
 }
 var self = this;
 var pUser = pGameDataMgr.userMgr.getUser(uid);
 if (!pUser) {
 logger.info('用户 %d使用道具错误，没有这个用户', uid);
 return false;
 }
 var pPlayerR = pUser.getPlayerRoleData();
 if (!pPlayerR) {
 logger.info('用户 %d使用道具错误，没有这个用户角色', uid);
 return false;
 }
 var pGiftRewardData = pGameMgr.ItemGroupTable.GetDataOfKey(itemGroupId);
 if (!pGiftRewardData || pGiftRewardData.length < 1)
 return false;  // 没有奖励
 // 开始给奖励
 var tempRow = gameEnume.ItemGroupTbl.ItemGroup_GaiLv1;
 var goodsNum = gameEnume.ItemGroupTbl.ItemGroup_GoodsNum;
 var reward_list = [];
 for (var ii = 0; ii < goodsNum; ii++) {
 var tempGailv = pGiftRewardData[tempRow];
 tempRow++;
 if (typeof( tempGailv ) != "number" || tempGailv == -2)
 break;
 var tempType = pGiftRewardData[tempRow];
 tempRow++;
 var tempIndex = pGiftRewardData[tempRow];
 tempRow++;
 var tempValue = pGiftRewardData[tempRow];
 tempRow++;
 if (tempGailv == -1 || (Math.floor(Math.random() * 1000) > tempGailv)) {
 reward_list.push([tempType, tempIndex, tempValue]);
 if (tempValue == undefined)
 tempValue = 0;
 self.getGameReward(uid, tempType, tempIndex, tempValue);
 }
 }
 return reward_list;
 }*/
PublicLogic.prototype.SendNotice = function (tempId, data) {
    var conserverid = this.app.get('conserverid');
    var channel = this.msgServer.getChannelbySid(conserverid);
    var params = {
        route: 'OnNotice',
        d: [tempId, data]
    };
    channel.pushMessage(params);
}
//增加物资
PublicLogic.prototype.addGoods = function (pPlayerR, goodsArr, logType) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    var pGameMgr = this.app.get('gameMgr');
    var pUserLogic = this.app.get('UserLogic');
    var pCardLogic = this.app.get('CardLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    //var pUser = pGameDataMgr.userMgr.getUser(uid);
    //var pPlayerR = pUser.getPlayerRoleData();
    var pid = pPlayerR.getPid();
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var self = this;
    for (var i = 0; i < goodsArr.length; i++) {
        var type = goodsArr[i][0];
        var num = goodsArr[i][1];
        switch (type) {
            case gameEnume.GoodsAddTypeTbl.Type_Money://金币
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, num);
                pAchieveLogic.addGods(pPlayerR, num);
                break;
            case gameEnume.GoodsAddTypeTbl.Type_Diamond://钻石
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND, num);
                break;
            case gameEnume.GoodsAddTypeTbl.Type_MONEY_TICKET://金币关卡入场券
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET, num);
                break;
            case gameEnume.GoodsAddTypeTbl.Type_RAND_TICKET://随机关卡入场券
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET, num);
                break;
            case gameEnume.GoodsAddTypeTbl.Type_PLAYER_EXP://人物的经验
                pUserLogic.changeUserExp(uid, num);//涉及等级变更
                // pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_EXP, num);
                break;
            default ://卡牌
                var cardId = type;
                var cardNum = num;
                var pCard = pPlayerR.getCard(cardId);
                if (pCard == undefined) {
                    pCard = new CardData();
                    pCard.setAllAttrib([-1, pid, cardId, 1, cardNum, 1]);
                    pPlayerR.addCard(pCard);
                    pAchieveLogic.addCardKindNum(pPlayerR, 1);
                    pAchieveLogic.addCardsNum(pPlayerR, cardNum);
                } else {
                    var oldNum = pCard.getAttrib()[gameEnume.cardAttrib.CARD_ATTRIB_NUM];
                    pCard.getAttrib()[gameEnume.cardAttrib.CARD_ATTRIB_NUM] = oldNum + cardNum;
                    pAchieveLogic.addCardsNum(pPlayerR, cardNum);
                }
                var tempTbl = pGameMgr.TableCardBaseInfo.GetElement(cardId);
                if (tempTbl) {
                    var cardQuality = tempTbl.getType_Level();
                    /*if(){
                     var tempId = 9100043;
                     //通知
                     self.SendNotice(tempId, [nickName, cardId]);
                     }*/
                }

                //卡牌单张更新
                pCardLogic.updataCard_DB(self, pCard, function (err, res) {
                });
                pCardLogic.sendCardTo_C(uid, [pCard.getAttrib()]);//不可放入上个方法回调函数内！！！
                break;
        }
    }//循环结束
    self.addNoteLogs(uid, logType, goodsArr);//日志记录

    //存盘
    pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
        //发送客户端
        pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
    });
}

PublicLogic.prototype.costGoods = function (pPlayerR, uid, costType, num, logType) {
    console.log('costGoods', uid, costType, num);
    var pUserLogic = this.app.get('UserLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var self = this;
    var flag = 0;
    switch (costType) {
        case gameEnume.GoodsCostTypeTbl.Type_Money:
            var userMoney = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY);
            if (num > userMoney) {
                logger.info('用户 %d ，金币不足', uid);
                return code.USER.FA_MONEY_NOT_ENOUGH;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, -num);
            //存盘
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!err) {
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                    pAchieveLogic.costGods(pPlayerR, num);
                    self.addOneNoteLog(uid, logType, costType, num);
                }
            });
            return flag;
            break;
        case gameEnume.GoodsCostTypeTbl.Type_Diamond:
            var userDiamond = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND);
            if (num > userDiamond) {
                logger.info('用户 %d ，钻石不足', uid);
                return code.USER.FA_DIAMOND_NOT_ENOUGH;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND, -num);
            //存盘
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!err) {
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                    self.addOneNoteLog(uid, logType, costType, num);
                }
            });
            return flag;
            break;
        case gameEnume.GoodsCostTypeTbl.Type_MONEY_TICKET:
            var moneyTicket = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET);
            if (num > moneyTicket) {
                logger.info('用户 %d ，金币关卡入场券不足', uid);
                return code.USER.FA_MONEYTICKET_NOT_ENOUGH;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET, -num);
            //存盘
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!err) {
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                    self.addOneNoteLog(uid, logType, costType, num);
                }
            });
            return flag;
            break;
        case gameEnume.GoodsCostTypeTbl.Type_RAND_TICKET:
            var userDiamond = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET);
            if (num > userDiamond) {
                logger.info('用户 %d ，随机关卡入场券不足', uid);
                return code.USER.FA_RANDTICKET_NOT_ENOUGH;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET, -num);
            //存盘
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!err) {
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                    self.addOneNoteLog(uid, logType, costType, num);
                }
            });
            return flag;
            break;
        default :
            return flag;
            break;
    }
}

PublicLogic.prototype.test = function (msg, session, next) {
    /*var gameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.thisName);
     var resource = [];
     console.log(gameConstantDataMgr.CardClassifyByType);
     var item = utils.getArrayRandomItems(gameConstantDataMgr.CardClassifyByType, 1);
     var cardId = item[0].getID_Card();
     console.log('cardId',cardId);*/
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');

    //动态数据检测
    // var pUser = pGameDataMgr.userMgr.getUser(uid);
    // if (!pUser) {
    //     logger.info('用户 %d ，没有这个用户', uid);
    //     next(null, {code: code.SERVER.FA_NOT_USER_DATA});
    //     return;
    // }
    // var pPlayerR = pUser.getPlayerRoleData();
    // if (!pPlayerR) {
    //     logger.info('用户 %d没有角色信息', uid);
    //     next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
    //     return;
    // }
    // var boxId = 9010909;
    // var pBoxLogic = this.app.get('BoxLogic');
    // var returnData = pBoxLogic.getBoxReward(pPlayerR, boxId);

    next(null, {code: code.OK, d: ['hello world..']});
    console.log('123123123');
    var pShopLogic = this.app.get('ShopLogic');
    pShopLogic.updateCard();

    // next(null, {code:code.OK,d:[returnData]});
    next(null, {code: code.OK, d: []});
}

//21点 计划任务 排行榜结算
PublicLogic.prototype.update02 = function () {
    var self = this;
    var rankNum = 50;
    var cityArr = [1, 2, 3, 4, 5, 6, 7];
    var sumArr = [];
    var time = 1000;//发送周期

    var q = async.queue(function (obj, cb) {
        setTimeout(function () {
            console.log('task...', obj);
            self.rankRewardFunc(obj, cb);
        }, obj.time)
    }, 1);

    async.series({
        one: function (callback3) {
            var isLimit = 0, mailId = 1, keys = CacheDb.prefix()['genSumRank'];
            self.rankMapFunc(cityArr, isLimit, mailId, keys, rankNum, function (err, res) {
                console.log('one', err, res);
                if (res.length > 0) {
                    sumArr = sumArr.concat(res);
                }

                callback3();
            });
        },
        two: function (callback3) {
            var isLimit = 1, mailId = 1, keys = CacheDb.prefix()['genSumRank'];
            self.rankMapFunc(cityArr, isLimit, mailId, keys, rankNum, function (err, res) {
                console.log('two', err, res);
                if (res.length > 0) {
                    sumArr.concat(res);
                }
                callback3();
            });
        },
        three: function (callback3) {
            var isLimit = 0, mailId = 2, keys = CacheDb.prefix()['limSumRank'];
            self.rankMapFunc(cityArr, isLimit, mailId, keys, rankNum, function (err, res) {
                console.log('three', err, res);
                if (res.length > 0) {
                    sumArr.concat(res);
                }
                callback3();
            });
        },
        four: function (callback3) {
            var isLimit = 1, mailId = 2, keys = CacheDb.prefix()['limSumRank'];
            self.rankMapFunc(cityArr, isLimit, mailId, keys, rankNum, function (err, res) {
                console.log('four', err, res);
                if (res.length > 0) {
                    sumArr.concat(res);
                }
                callback3();
            });
        },
        five: function (callback3) {
            console.log('five', sumArr);
            for (var item in sumArr) {
                q.push({
                    pid: sumArr[item][0],
                    uid: sumArr[item][1],
                    rank: sumArr[item][2],
                    score: sumArr[item][3],
                    cityId: sumArr[item][4],
                    isLimit: sumArr[item][5],
                    mailId: sumArr[item][6],
                    time: time
                });
            }
            callback3();
        }
    }, function () {
        q.saturated = function () {
            console.log('all workers to be used');
        }

        q.empty = function () {
            console.log('no more tasks wating');
        }

        q.drain = function () {
            console.log('all tasks have been processed');
        }
    })
}

//24点 计划任务
PublicLogic.prototype.update24 = function () {
    //关卡计划任务
    this.updateGuanka();
    //商城卡牌计划任务
    this.updateShopCard();
}

PublicLogic.prototype.updateShopCard = function () {
    var self = this;
    var pShopLogic = self.app.get('ShopLogic');
    pShopLogic.updateCard();
}

PublicLogic.prototype.updateGuanka = function () {
    var self = this;
    var pGameDataMgr = self.app.get('gameDataMgr');
    var pFightLogic = self.app.get('FightLogic');
    var q = async.queue(function (obj, cb) {
        setTimeout(function () {
            console.log('update24Guanka task...');
            pFightLogic.sendGuankaTo_C(obj.uid, [obj.item]);
            cb();
        }, obj.time)
    }, 1);

    GuankaDb.update24Guanka(self.app, function (err, res) {
        var pUserData = pGameDataMgr.userMgr.userDatas;
        if (!utils.isEmptyObject(pUserData)) {
            var uid;
            for (uid in pUserData) {
                var flag = self.msgServer.getRecordbyUid(uid);
                if (flag) {
                    var pUser = pUserData[uid];
                    if (pUser) {
                        var pPlayerR = pUser.getPlayerRoleData();
                        var pGuankaData = pPlayerR.guanKaMgr;
                        for (var jj in pGuankaData) {
                            pGuankaData[jj].setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_DailyMedal, 0);
                            pGuankaData[jj].setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_Round, '');
                            q.push({uid: uid, item: pGuankaData[jj].getAttrib(), time: 500});
                        }
                    }
                }
            }
        } else {
            console.log('没有用户数据');
        }
    });

    q.saturated = function () {
        console.log('all workers to be used');
    }

    q.empty = function () {
        console.log('no more tasks wating');
    }

    q.drain = function () {
        console.log('all tasks have been processed');
    }
}

PublicLogic.prototype.rankMapFunc = function (cityArr, isLimit, mailId, keys, rankNum, callback) {
    var self = this;
    var returnArr = [];
    async.mapSeries(cityArr, function (cityId, callback2) {
        CacheDb.getRank100(self.app, keys + cityId + '-' + isLimit, rankNum, function (err, res) {
            if (res.length < 1) {
                //console.log('该大关卡没有数据', cityId , err, res);
                callback2(null, []);
            } else {
                //var genData = pRankLogic.dealUsersKeyFunc(res);
                var arrLen = res.length;
                var j = 1;
                for (var i = 0; i < arrLen; i++) {
                    if ((i % 2) == 0) {
                        var userArr = res[i].split('#');
                        var deScore = utils.getDeScore(res[i + 1]);
                        returnArr.push([userArr[0], userArr[1], j, deScore, cityId, isLimit, mailId]);
                        j++;
                    }
                }
                console.log('删除keys...', keys + cityId + '-' + isLimit);
                //删除keys..
                CacheDb.truncateCityScore(self.app, keys + cityId + '-' + isLimit);
                callback2(null, returnArr);
            }
        })
    }, function () {
        callback(null, returnArr);
    })
    /*for(var ii = 1; ii <= 7; ii++){
     cityId = ii;
     async.waterfall([
     function(callback){
     CacheDb.getRank100(self.app, keys + cityId +'-'+ isLimit, rankNum, function(err, res){
     var genData = pRankLogic.dealUsersKeyFunc(res);
     if(res.length < 1){
     console.log('该大关卡没有数据', cityId , err, res);
     callback(true);
     } else {
     callback(null, genData, cityId);
     }
     })
     },
     function(rankArr, cityId, callback){
     console.log('step2...', rankArr, cityId);
     //self.rankRewardFunc(rankArr, keys, cityId, isLimit, mailId, callback);
     }
     ], function(err, res){
     })
     }*/
}
PublicLogic.prototype.rankRewardFunc = function (item, callback) {
    var pGameMgr = this.app.get('gameMgr');
    var self = this;
    var pMailsLogic = this.app.get('MailsLogic');
    var pUserLogic = this.app.get('UserLogic');
    var pGameDataMgr = self.app.get('gameDataMgr');

    var pid = parseInt(item['pid']);
    var uid = parseInt(item['uid']);
    var rankNum = parseInt(item['rank']);
    var score = parseInt(item['score']);
    var cityId = parseInt(item['cityId']);
    var isLimit = parseInt(item['isLimit']);
    var mailId = parseInt(item['mailId']);

    var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
    var pRankTable = pGameMgr.TableRank.Data();
    var cityName = pCityGuanKaTable.getName_RoundBig();

    var boxId;
    for (var i in pRankTable) {
        if (pRankTable[i].getID_RoundBig() == cityId && pRankTable[i].getType_Rank() == 1) {
            if (pRankTable[i].getRank()[0] == pRankTable[i].getRank()[1]) {
                if ((rankNum == pRankTable[i].getRank()[0]) && (rankNum == pRankTable[i].getRank()[1])) {
                    boxId = pRankTable[i].getAward_Rank();
                }
            } else {
                if ((rankNum >= pRankTable[i].getRank()[0]) && (rankNum <= pRankTable[i].getRank()[1])) {
                    boxId = pRankTable[i].getAward_Rank();
                }
            }
        }
    }
    var valueArr = [];
    var curUnixTime = utils.getCurrTime();
    var dateCurTime = utils.getDateYY_MM_dd(curUnixTime);
    valueArr.push(dateCurTime);
    valueArr.push(cityName);
    valueArr.push(rankNum);
    var valueStr = valueArr.join(',');

    var pUser = pGameDataMgr.userMgr.userDatas[uid];

    if (pUser && self.msgServer.getRecordbyUid(uid)) {
        //推客户端
        var pPlayerR = pUser.getPlayerRoleData();
        console.log('推客户端...');
        var dataH = [-1, pid, cityName, dateCurTime, rankNum];
        UserDb.updatePlayerHonor(self.app, dataH, function (err, res) {
            pPlayerR.addHonor([res[0][0]['OID'], pid, cityName, dateCurTime, rankNum]);
            pUserLogic.sendHonorTo_C(uid, pPlayerR.getHonor());
        })
        //发邮件
        pMailsLogic.addMail(pPlayerR, mailId, boxId, valueStr);
        callback();
    } else {
        console.log('没推客户端...');
        //发邮件
        MailDb.updatePlayerMails(self.app, [-1, pid, mailId, boxId, utils.getCurrTime(), 0, 0, valueStr], function (err, res) {
        });
        //给荣誉
        UserDb.updatePlayerHonor(self.app, [-1, pid, cityName, dateCurTime, rankNum], function () {
        })
        callback();
    }
}

/**
 * 宝箱、附件信息同步
 * @param uid
 * @param data
 */
PublicLogic.prototype.sendAddGoodsTo_C = function (uid, data, boxId) {
    var route = 'OnUpdataGoods';
    data.unshift(boxId);
    var data = {d: data};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
