
var gameEnume = require('./gameEnume');
var ShopData = function () {
    this.attrib = [];
};

module.exports = ShopData;

ShopData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

ShopData.prototype.getAttrib = function () {
    return this.attrib;
};

ShopData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

ShopData.prototype.setOneAttrib = function (index,data) {
     this.attrib[index] = data;
};

ShopData.prototype.getToClientAttrib = function () {
    var canBuyNum = this.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_TOTAL_NUM] - this.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_BUY_NUM];
    return [this.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_ID],
            this.attrib[gameEnume.pShopCardAttrib.SHOP_ATTRIB_CID],
            canBuyNum];
};
ShopData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};