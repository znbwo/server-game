
var gameEnume = require('./gameEnume');
var AchieveData = function () {
    this.attrib = [];
};

module.exports = AchieveData;

AchieveData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

AchieveData.prototype.getAttrib = function () {
    return this.attrib;
};

AchieveData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

AchieveData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};