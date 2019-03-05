var gameEnume = require('../gameData/gameEnume');
var CardData = function () {
    this.attrib = [];
};

module.exports = CardData;

CardData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

CardData.prototype.changeCount = function (data) {
    this.attrib[gameEnume.cardAttrib.CARD_ATTRIB_NUM] += data;
};
CardData.prototype.getAttrib = function () {
    return this.attrib;
};

CardData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

CardData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};