var gameEnume = require('../gameData/gameEnume');
var CardGroupData = function () {
    this.attrib = [];
};

module.exports = CardGroupData;

CardGroupData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

CardGroupData.prototype.getAttrib = function () {
    return this.attrib;
};

CardGroupData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

CardGroupData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};