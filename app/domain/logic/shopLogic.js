/**
 * Created by Administrator on 2016/12/8 0008.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../../util/utils');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var ShopDao = require('../../mysql/shopDb');
var ShopData = require('../gameData/shopData');
var async = require('async');


var ShopLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = ShopLogic;
/**
 * 打折卡牌购买
 * @param msg
 * @param session
 * @param next
 */
ShopLogic.prototype.discountCard = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = this.app.get('PublicLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
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
    //校验玩家数据
    var cardId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_rewardCard);
    var dropTime = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardDropTime);
    if (cardId == 0 || dropTime == 0) {
        next(null, {code: code.SHOP.FA_SHOP_NO_EXIST});
        return;
    }
    //时效性
    var seconds = pGameMgr.TableConstant.GetElement(gameEnume.constant.secondOfDropCard).getValue_Constant();
    if (seconds == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var endTime = dropTime + seconds;
    if (utils.getCurrTime() > endTime) {
        //清空过期商品
        pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_rewardCard, 0);
        pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardDropTime, 0);
        pAchieveLogic.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
            pAchieveLogic.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
        });
        next(null, {code: code.SHOP.FA_SHOP_OUT_TIME});
        return;
    }
    //计算钻石消耗
    var tempCardData = pGameMgr.TableCardBaseInfo.GetElement(cardId);
    if (tempCardData == undefined) {
        next(null, {code: code.SHOP.FA_SHOP_NO_TABLE_ERR});
        return;
    }
    var totalPrice = tempCardData.getPrice_Diamond_Card()[0];
    var buyNum = tempCardData.getPrice_Diamond_Card()[1];
    // 商品单价  已购买数  要购买数
    // var reducePrice = calculateCardTotalPrice(basePrice, 0, buyNum);
    var reducePrice = totalPrice;
    if (reducePrice > pPlayerR.attrib[gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND]) {
        next(null, {code: code.SHOP.FA_SHOP_NO_enough_Diamond});
        return;
    }
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_rewardCard, 0);
    pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardDropTime, 0);
    pAchieveLogic.updatePlayerNote(this.app, pPlayerR.getNoteAttrib(), function (err, res) {
        pAchieveLogic.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
    });
    //消耗与发放
    publicLogic.addGoods(pPlayerR, [[cardId, buyNum]], gameEnume.logTypeEnume.discountShopAdd);
    publicLogic.costGoods(pPlayerR, uid, gameEnume.GoodsCostTypeTbl.Type_Diamond, reducePrice, gameEnume.logTypeEnume.discountShopReduce);
    next(null, {code: code.OK});
    return;
}
ShopLogic.prototype.applyShop = function (msg, session, next) {
    var self = this;
    if (msg['d'].length != 3) {
        next(null, {code: code.SERVER.FA_SHOP_Client_ARG_ERR});
        return;
    }
    var shopType = parseInt(msg['d'][0]);//1宝箱 2卡牌 3金币 4钻石
    var shopId = parseInt(msg['d'][1]);
    var buyNum = parseInt(msg['d'][2]);

    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = this.app.get('PublicLogic');
    var pBoxLogic = this.app.get('BoxLogic');
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
    //判断类型
    switch (shopType) {
        case 1://宝箱商城
            //数据校验
            var tableData = pGameMgr[gameEnume.tableNameEnume.TableTreasuerBoxInfo];
            if (tableData == undefined) {
                next(null, {code: code.SHOP.FA_SHOP_NO_TABLE_ERR});
                return;
            }
            var boxId = shopId;//宝箱id
            var boxDataInfo = tableData.Data()[boxId];
            if (boxDataInfo == undefined) {
                next(null, {code: code.SHOP.FA_SHOP_NO_TABLE_ERR});
                return;
            }
            //计算宝箱钻石消耗
            var needDiamond = boxDataInfo.getPrice_Diamond_Treasure();
            var have = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND);
            if (needDiamond > have) {
                next(null, {code: code.SHOP.FA_SHOP_NO_enough_Diamond});
                return;
            }
            //消耗资源
            publicLogic.costGoods(pPlayerR, uid, gameEnume.GoodsCostTypeTbl.Type_Diamond, needDiamond, gameEnume.logTypeEnume.shopReduce);
            //获得资源
            pBoxLogic.getBoxReward(pPlayerR, boxId);
            next(null, {code: code.OK, d: []});
            return;
        case 2://卡牌商城
            //从卡牌商城中校验商品id
            var gameConstantDataMgr = self.app.get(gameEnume.gameConstantDataMgr.thisName);
            var roundId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.roundId);
            var constantShopCardMgr = gameConstantDataMgr[gameEnume.gameConstantDataMgr.shopCard][roundId];
            if (constantShopCardMgr == undefined) {
                next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
                return;
            }
            var shopCard = constantShopCardMgr[shopId];//商品idg
            if (shopCard == undefined) {
                next(null, {code: code.SHOP.FA_SHOP_NO_EXIST});
                return;
            }
            var cardId = shopCard[gameEnume.shopCardAttrib.CID];
            var totalNum = shopCard[gameEnume.shopCardAttrib.num];
            var basePrice = shopCard[gameEnume.shopCardAttrib.price];
            var pShopData = pPlayerR.getOneShopData(cardId);
            var boughtNum = (pShopData == undefined) ? 0 : pShopData.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM];
            var canBuyNum = totalNum - boughtNum;
            if (buyNum > canBuyNum) {
                next(null, {code: code.SHOP.FA_SHOP_NO_NUM});
                return;
            }
            //计算金币消耗
            var reducePrice = calculateCardTotalPrice(basePrice, boughtNum, buyNum);
            if (reducePrice > pPlayerR.attrib[gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY]) {
                next(null, {code: code.SHOP.FA_SHOP_NO_enough_Gold});
                return;
            }
            if (pShopData == undefined) {
                // 给玩家加入该条数据
                var data = [-1, pid, cardId, buyNum];
                ShopDao.updatePlayerShop(self.app, data, function (err, res) {
                    if (res && res.length > 0 && res[0][0]['ECode'] == 0) {
                        data[0] = res[0][0]['OID'];
                        var pShopData = new ShopData();
                        pShopData.setAllAttrib(data);
                        pPlayerR.addShop(pShopData);
                        var returnShop = self.getOneCardShopToClient(pPlayerR.getShopMgr(), constantShopCardMgr, shopId);
                        self.sendShopDataToClient(uid, returnShop);
                    }
                });

            } else {
                pShopData.setOneAttrib(gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM, pShopData.getOneAttrib(gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM) + buyNum);
                ShopDao.updatePlayerShop(self.app, pShopData.attrib, function (err, res) {
                    var returnShop = self.getOneCardShopToClient(pPlayerR.getShopMgr(), constantShopCardMgr, shopId);
                    self.sendShopDataToClient(uid, returnShop);
                });
            }

            //变更玩家数据（添加卡牌、消耗金币）
            publicLogic.costGoods(pPlayerR, uid, gameEnume.GoodsCostTypeTbl.Type_Money, reducePrice, gameEnume.logTypeEnume.shopReduce);
            publicLogic.addGoods(pPlayerR, [[cardId, buyNum]], gameEnume.logTypeEnume.shopAdd);

            next(null, {code: code.OK, d: []});
            return;
        case 3://购买金币 读静态表
            var sExchange_Gold = pGameMgr.TableExchange_Gold.Data()[shopId];
            if (sExchange_Gold == undefined) {
                next(null, {code: code.SHOP.FA_SHOP_NO_TABLE_ERR});
                return;
            }
            //钻石数校验
            var have = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND);
            var need = sExchange_Gold.getPrice_Diamond();
            if (need > have) {
                next(null, {code: code.SHOP.FA_SHOP_NO_enough_Diamond});
                return;
            }
            //变更玩家数据
            publicLogic.costGoods(pPlayerR, uid, gameEnume.GoodsCostTypeTbl.Type_Diamond, sExchange_Gold.getPrice_Diamond(), gameEnume.logTypeEnume.shopReduce);
            publicLogic.addGoods(pPlayerR, [[gameEnume.GoodsAddTypeTbl.Type_Money, sExchange_Gold.getNum_Gold()]], gameEnume.logTypeEnume.shopAdd);
            next(null, {code: code.OK, d: []});
            return;
        case 4:
            var sAppPrice = pGameMgr.TableAppPrice.Data()[shopId];
            if (sAppPrice == undefined) {
                next(null, {code: code.SHOP.FA_SHOP_NO_TABLE_ERR});
                return;
            }
            //TODO （支付系统)
            //变更玩家数据
            publicLogic.addGoods(pPlayerR, [[gameEnume.GoodsAddTypeTbl.Type_Diamond, sAppPrice.getNum_Diamond()]], gameEnume.logTypeEnume.shopAdd);
            next(null, {code: code.OK, d: []});
            return;
        default :
            //返回参数错误
            next(null, {code: code.SERVER.FA_NO_SHOP_TYPE_EXIST});
            return;
    }
};


ShopLogic.prototype.getConstantCardShopDataByRoundId = function (roundId) {
    var gameConstantDataMgr = this.app.get(gameEnume.gameConstantDataMgr.thisName);
    var constShopCardMgr = gameConstantDataMgr[gameEnume.gameConstantDataMgr.shopCard];
    var shopCardData = constShopCardMgr[roundId];
    return shopCardData;
}
/**
 *
 * @param shopMgr 玩家商城
 * @param shopCardData 游戏商城
 */
ShopLogic.prototype.getCardShopToClient = function (pPlayerR) {
    var shopMgr = pPlayerR.getShopMgr();
    var roundId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.roundId);
    var constantShopCardData = this.getConstantCardShopDataByRoundId(roundId);
    var result = [];//商品id,卡牌id,还可买数量
    for (var shop in constantShopCardData) {
        var shopId = constantShopCardData[shop][0];
        var cardId = constantShopCardData[shop][2];
        var totalNum = constantShopCardData[shop][3];
        var canBuyNum = totalNum;
        if (shopMgr[cardId] != undefined) {
            canBuyNum = totalNum - shopMgr[cardId].attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM];
        }
        result.push([shopId, cardId, canBuyNum]);
    }
    result.unshift(1);
    return result;
};
ShopLogic.prototype.getOneCardShopToClient = function (shopMgr, constantShopCardData, shopId) {
    var result = [];//商品id,卡牌id,还可买数量
    if (constantShopCardData[shopId] != undefined) {
        var cardId = constantShopCardData[shopId][gameEnume.shopCardAttrib.CID];
        var totalNum = constantShopCardData[shopId][gameEnume.shopCardAttrib.num];
        var canBuyNum = totalNum;
        if (shopMgr[cardId] != undefined) {
            canBuyNum = totalNum - shopMgr[cardId].attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM];
        }
        result.unshift(0);
        result.push([shopId, cardId, canBuyNum]);
    }
    return result;
};

function initNewShopDataSql(self, canBuyMap, sqlStr, cb) {
    //产生新商城数据
    var pBoxLogic = self.app.get('BoxLogic');
    var gameConstantDataMgr = self.app.get(gameEnume.gameConstantDataMgr.thisName);
    var preCardNum = 1;
    if (new Date().getDay() == 7) {
        preCardNum = 2;
    }
    var pGameMgr = self.app.get('gameMgr');
    var roundCount = pGameMgr.TableRound_Big.Count();
    for (var roundId = 1; roundId <= roundCount; roundId++) {
        var result = [];
        result = result.concat(utils.getArrayRandomItems(pBoxLogic.getCardsByOpenRound(gameConstantDataMgr.CommonCardByOpenLevel, roundId), preCardNum)); //随机出来的卡牌
        result = result.concat(utils.getArrayRandomItems(pBoxLogic.getCardsByOpenRound(gameConstantDataMgr.RareCardByOpenLevel, roundId), preCardNum)); //随机出来的卡牌
        result = result.concat(utils.getArrayRandomItems(pBoxLogic.getCardsByOpenRound(gameConstantDataMgr.EpicCardByOpenLevel, roundId), preCardNum)); //随机出来的卡牌
        for (var j = 0; j < result.length; j++) {
            var cId = result[j].getID_Card();
            var totalNum = result[j].getPrice_Gold_Card()[1];
            var basePrice = result[j].getPrice_Gold_Card()[0];
            canBuyMap[cId] = totalNum;
            sqlStr += '(' + roundId + ',' + cId + ',' + totalNum + ',' + basePrice + ')';
            var lastData = (roundId == roundCount && j == result.length - 1);
            if (!lastData) {
                sqlStr += ",";
            }
        }
    }
    cb();
    return sqlStr;
}
function emptyOldShopData(self, cb) {
    //删除旧商城数据
    ShopDao.emptyCardShop(self.app, function () {
        cb();
    });
}
function updateShopData(self, sqlStr, canBuyMap, toClient, cb) {
    //新商城存库
    ShopDao.insertShopCard(self.app, sqlStr, function (err, res) {
        //读入内存
        ShopDao.getCardShop(self.app, function (err, res) {
            if (err) {
                logger.error('getCardShop ShopDao failed!' + err.stack);
            } else {
                var shopCardData = {};
                for (var i = 0; i < res.length; i++) {
                    var shopId = res[i][0];
                    var roundId = res[i][1];
                    var cardId = res[i][2];
                    if (shopCardData[roundId] == undefined) {
                        shopCardData[roundId] = {};
                    }
                    shopCardData[roundId][shopId] = res[i];
                    var tNum = canBuyMap[cardId];
                    if (toClient[roundId] == undefined) {
                        toClient[roundId] = [];
                    }
                    toClient[roundId].push([shopId, cardId, tNum]);//id,cardId,num
                }
                var gameConstantDataMgr = self.app.get(gameEnume.gameConstantDataMgr.thisName);
                gameConstantDataMgr[gameEnume.gameConstantDataMgr.shopCard] = shopCardData;
            }
            cb();
        })
    });
}
function updatePlayerShopData(self, toClient, cb) {
    //删除玩家旧数据
    ShopDao.emptyPlayerShop(self.app, function (err, res) {
        if (!err) {
            ShopDao.updatePlayerNoteRoundIdFromBigRound(self.app, function (err, res) {
                var userData = self.app.get('gameDataMgr').userMgr.userDatas;
                for (var i in userData) {
                    var uid = userData[i].uid;
                    var pPlayerR = userData[i].getPlayerRoleData();
                    var bigRoundId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_bigRound);
                    var flag = self.msgServer.getRecordbyUid(uid);
                    if (flag) {
                        //删已购买商品内存
                        userData[i].getPlayerRoleData().shopMgr = {};
                        //发新商品数据
                        self.sendShopDataToClient(uid, toClient[bigRoundId]);
                    }
                }
                cb();
            });
        }
    });
}
ShopLogic.prototype.updateCard = function () {
    var self = this;
    var sqlStr = '';
    var canBuyMap = {};//卡牌可购买数
    // var toClient = [];//id,cardId,totalNum
    var toClient = {};
    async.series([
            function (cb) {
                sqlStr = initNewShopDataSql(self, canBuyMap, sqlStr, cb);
            },
            function (cb) {
                emptyOldShopData(self, cb);
            },
            function (cb) {
                updateShopData(self, sqlStr, canBuyMap, toClient, cb);
            },
            function (cb) {
                updatePlayerShopData(self, toClient, cb);
            }
        ],
        function (err, result) {
            if (err) {
                logger.err('err happen in ShopLogic updatedCard');
            }
        });
}
/**
 * 商品单价  已购买数  要购买数
 * @param price
 * @param boughtNum
 * @param buyNum
 * @returns {number}
 */
function calculateCardTotalPrice(price, boughtNum, buyNum) {
    var total = 0
    for (var i = 0; i < buyNum; i++) {
        total += price * ( boughtNum + i + 1);
    }
    return total;
}

ShopLogic.prototype.sendShopDataToClient = function (uid, dataArr) {
    var route = 'OnUpdataCardShop';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
