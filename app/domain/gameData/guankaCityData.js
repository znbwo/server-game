var gameEnume = require('../gameData/gameEnume');
var GuankaCityData = function () {
    this.attrib = [];
};

module.exports = GuankaCityData;

GuankaCityData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

GuankaCityData.prototype.getAttrib = function () {
    return this.attrib;
};
GuankaCityData.prototype.changeCount = function (attribId, value) {
    this.attrib[attribId] += value;
};
GuankaCityData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

GuankaCityData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};