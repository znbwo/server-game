var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var TableData = require('./tableData.js');
var gameEnume = require('./gameEnume.js');
var ShopDb = require('../../mysql/shopDb.js');
var updatedCard = false;
var GameConstantData = function (app) {
    this.app = app;
    this.objectData = {};
    this.init();
};

GameConstantData.prototype.init = function () {
    cardClassify.call(this);
    shopCardInit.call(this);
    tribeInit.call(this);// 部落
};

function shopCardInit() {
    var self = this;
    ShopDb.getCardShop(self.app, function (err, res) {
        if (err) {
            logger.error('getCardShop ShopDao failed!' + err.stack);
        } else {
            var shopCardData = {};//商品id为key
            if (res.length <= 0 && updatedCard == false) {
                var pShopLogic = self.app.get('ShopLogic');
                pShopLogic.updateCard();
                updatedCard = true;
                shopCardInit.call(self);
            } else {
                for (var i = 0; i < res.length; i++) {
                    var shopId = res[i][0];
                    var roundId = res[i][1];
                    if (shopCardData[roundId] == undefined) {
                        shopCardData[roundId] = {};
                    }
                    shopCardData[roundId][shopId] = res[i];
                }
                self.objectData[gameEnume.gameConstantDataMgr.shopCard] = shopCardData;
            }
        }
    })
}

/**
 * 卡牌分类
 */
function cardClassify() {
    var self = this;
    var data = self.app.get(gameEnume.gameMgrEnume.thisName)[gameEnume.tableNameEnume.TableCardBaseInfo].Data();
    var tableData = new TableData(data);
    var canUseTableData = new TableData(tableData.find('_ID_Card', 0, 1, 2));
    var CommonCard = canUseTableData.findBy('_Type_Level', gameEnume.cardType.Common);
    self.objectData['CommonCard'] = CommonCard;
    var RareCard = canUseTableData.findBy('_Type_Level', gameEnume.cardType.Rare);
    self.objectData['RareCard'] = RareCard;
    var EpicCard = canUseTableData.findBy('_Type_Level', gameEnume.cardType.Epic);
    self.objectData['EpicCard'] = EpicCard;
    var LegendaryCard = canUseTableData.findBy('_Type_Level', gameEnume.cardType.Legendary);
    self.objectData['LegendaryCard'] = LegendaryCard;

    //按类型分类 by fei 20161219
    var newCardArr = RareCard.concat(EpicCard);
    self.objectData['CardClassifyByType'] = newCardArr;

    self.objectData['CommonCardByOpenLevel'] = {};
    for (var i = 0; i < CommonCard.length; i++) {
        var roundNum = CommonCard[i].getID_Round();
        var rcArr = self.objectData['CommonCardByOpenLevel'][roundNum];
        if (rcArr == undefined) {
            rcArr = [];
            self.objectData['CommonCardByOpenLevel'][roundNum] = rcArr;
        }
        rcArr.push(CommonCard[i]);
    }
    self.objectData['RareCardByOpenLevel'] = {};
    for (var i = 0; i < RareCard.length; i++) {
        var roundNum = RareCard[i].getID_Round();
        var rcArr = self.objectData['RareCardByOpenLevel'][roundNum];
        if (rcArr == undefined) {
            rcArr = [];
            self.objectData['RareCardByOpenLevel'][roundNum] = rcArr;
        }
        rcArr.push(RareCard[i]);
    }
    self.objectData['EpicCardByOpenLevel'] = {};
    for (var i = 0; i < EpicCard.length; i++) {
        var roundNum = EpicCard[i].getID_Round();
        var rcArr = self.objectData['EpicCardByOpenLevel'][roundNum];
        if (rcArr == undefined) {
            rcArr = [];
            self.objectData['EpicCardByOpenLevel'][roundNum] = rcArr;
        }
        rcArr.push(EpicCard[i]);
    }
    self.objectData['LegendaryCardByOpenLevel'] = {};
    for (var i = 0; i < LegendaryCard.length; i++) {
        var roundNum = LegendaryCard[i].getID_Round();
        var rcArr = self.objectData['LegendaryCardByOpenLevel'][roundNum];
        if (rcArr == undefined) {
            rcArr = [];
            self.objectData['LegendaryCardByOpenLevel'][roundNum] = rcArr;
        }
        rcArr.push(LegendaryCard[i]);
    }

}

function tribeInit() {
    var self = this;
   //TODO 1
}
module.exports = GameConstantData;

GameConstantData.prototype.setAllAttrib = function (data) {
    this.objectData = data;
};

GameConstantData.prototype.getAttrib = function (key) {
    return this.objectData[key];
};


GameConstantData.prototype.setAttrib = function (attribId, value) {
    this.objectData[attribId] = value;
};

GameConstantData.prototype.Data = function (attribId, value) {
    return this.objectData;
};