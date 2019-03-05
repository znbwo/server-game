var gameEnume = require('../gameData/gameEnume');
var utils = require('../../util/utils');
/**
 * Initialize a new 'Player' with the given 'opts'.
 *
 * @param {Object} opts
 * @api public
 */
var playerRoleData = function (uid) {
    this.uid = uid;                        // 用户ID
    this.pid = -1;                         // 玩家角色ID
    this.attrib = [];                      // 玩家属性
    this.cardMgr = {};                     // 卡牌数据的管理器
    this.cardGroupMgr = {};                // 卡牌组数据的管理器
    this.baseMgr = {};                     // 基地的管理器
    this.mailMgr = {};                     // 玩家的消息管理器
    this.guanKaMgr = {};                   // 管卡数据的管理器
    //this.guanKaCityMgr = {};             // 城池数据的管理器
    this.userHonorMgr = [];                // 荣誉数据的管理器
    this.shopMgr = {};                     // 玩家商城的管理器 卡牌id为key
    this.boxMgr = {};                      // 玩家宝箱的管理器 宝箱位为key
    //this.boxPostionMgr = [0,0,0,0];                  // 玩家宝箱的管理器 宝箱id为key
    this.achieveMgr = {};                  // 玩家成就的管理器
    this.noteAttrib = [];                 // 玩家记录属性
    this.arenaAttrib = [];                 // 玩家竞技场
    this.limitTimeFlag = 0;             // 限时模式定时器标示
};

module.exports = playerRoleData;


playerRoleData.prototype.getPid = function () {
    return this.pid;
};

playerRoleData.prototype.setPid = function (pid) {
    this.pid = pid;
};


playerRoleData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};


playerRoleData.prototype.getAttrib = function () {
    return this.attrib;
};

playerRoleData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};

playerRoleData.prototype.setAllAttrib = function (value) {
    this.attrib = value;
};


playerRoleData.prototype.changeAttribCount = function (attribId, value) {
    this.attrib[attribId] += value;
    if (this.attrib[attribId] < 0) {
        this.attrib[attribId] = 0;
    }
};

playerRoleData.prototype.getOneAttribInfo = function (index) {
    return this.attribInfo[index];
};


playerRoleData.prototype.getAttribInfo = function () {
    return this.attribInfo;
};

playerRoleData.prototype.setAttribInfo = function (attribId, value) {
    this.attribInfo[attribId] = value;
};

playerRoleData.prototype.setAllAttribInfo = function (value) {
    this.attribInfo = value;
};


playerRoleData.prototype.changeAttribInfoCount = function (attribId, value) {
    this.attribInfo[attribId] += value;
};

//添加卡牌数据到管理器
playerRoleData.prototype.addCard = function (data) {
    var CardId = data.attrib[gameEnume.cardAttrib.CARD_ATTRIB_CID];
    this.cardMgr[CardId] = data;
}
//获取卡牌数据
playerRoleData.prototype.getCard = function (index) {
    return this.cardMgr[index];
}

//获取一条卡牌数据
playerRoleData.prototype.getOneCard = function (CardId, id) {
    return this.cardMgr[CardId][id];
}

//添加基地数据到管理器
playerRoleData.prototype.addBase = function (data) {
    this.baseMgr = data;
}
//获取基地数据
playerRoleData.prototype.getBase = function () {
    return this.baseMgr;
}

//添加卡牌组数据到管理器
playerRoleData.prototype.addCardGroup = function (data) {
    var type = data.attrib[gameEnume.cardGroupAttrib.CARDGroup_ATTRIB_GTYPE];
    this.cardGroupMgr[type] = data;
}

//获取卡组数据
playerRoleData.prototype.getCardGroup = function (type) {
    return this.cardGroupMgr[type];
}


//添加用户消息到消息管理器
playerRoleData.prototype.addMail = function (data) {
    var mailId = data.getAttrib()[gameEnume.mailAttrib.MAIL_ATTRIB_ID];
    this.mailMgr[mailId] = data;
}

//添加关卡数据到管理器
playerRoleData.prototype.addGuanka = function (data) {
    var guankaCityId = data.attrib[gameEnume.guankaAttrib.GUANQIA_ATTRIB_CITY];
    this.guanKaMgr[guankaCityId] = data;
}
//获取关卡数据
playerRoleData.prototype.getGuanka = function (index) {
    return this.guanKaMgr[index];
}

/*//添加城池数据到管理器
 playerRoleData.prototype.addGuankaCity = function(data){
 var guankaCityId = data.attrib[gameEnume.guankaCityAttrib.GUANQIA_ATTRIB_CID];
 this.guanKaCityMgr[guankaCityId] = data;
 }
 //获取城池数据
 playerRoleData.prototype.getGuankaCity = function(index){
 return this.guanKaCityMgr[index];
 }*/

//添加荣誉数据到管理器
playerRoleData.prototype.addHonor = function (data) {
    this.userHonorMgr.push(data);
}
//获取荣誉数据
playerRoleData.prototype.getHonor = function () {
    return this.userHonorMgr;
}

//添加用户商城到消息管理器
playerRoleData.prototype.addShop = function (data) {
    var shopId = data.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_CID];
    this.shopMgr[shopId] = data;
}

playerRoleData.prototype.getShopMgr = function () {
    return this.shopMgr;
}

playerRoleData.prototype.getOneShopData = function (index) {
    return this.shopMgr[index];
}
playerRoleData.prototype.addBox = function (data) {
    var boxPostion = data.attrib[gameEnume.boxAttrib.BOX_ATTRIB_POSITION];
    this.boxMgr[boxPostion] = data;
}
playerRoleData.prototype.removeBox = function (data) {
    var position = data.attrib[gameEnume.boxAttrib.BOX_ATTRIB_POSITION];
    delete this.boxMgr[position];
}
playerRoleData.prototype.getBoxMgr = function () {
    return this.boxMgr;
}

playerRoleData.prototype.getOneBox = function (index) {
    return this.boxMgr[index];
}


playerRoleData.prototype.addAchieve = function (data) {
    var achieveId = data.getOneAttrib(gameEnume.achieveAttrib.ACH_ATTRIB_AID);
    this.achieveMgr[achieveId] = data;
}
playerRoleData.prototype.getAchieveMgr = function () {
    return this.achieveMgr;
}

playerRoleData.prototype.setNoteAttrib = function (data) {
    this.noteAttrib = data;
}
playerRoleData.prototype.getNoteAttrib = function () {
    return this.noteAttrib;
}
playerRoleData.prototype.getOneNoteAttrib = function (index) {
    return this.noteAttrib[index];
}
playerRoleData.prototype.setOneNoteAttrib = function (index, data) {
    this.noteAttrib[index] = data;
}
playerRoleData.prototype.setArenaAttrib = function (data) {
    this.arenaAttrib = data;
}
playerRoleData.prototype.getArenaAttrib = function () {
    return this.arenaAttrib;
}
playerRoleData.prototype.getOneArenaAttrib = function (index) {
    return this.arenaAttrib[index];
}
playerRoleData.prototype.setOneArenaAttrib = function (index, data) {
    this.arenaAttrib[index] = data;
}
