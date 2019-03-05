var gameEnume = require('../gameData/gameEnume');
var GuankaData = function () {
    this.attrib = [];
};

module.exports = GuankaData;

GuankaData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

GuankaData.prototype.getAttrib = function () {
    return this.attrib;
};

GuankaData.prototype.changeAttribCount = function (attribId, value) {
    this.attrib[attribId] += value;
    if(this.attrib[attribId] < 0){
        this.attrib[attribId] = 0;
    }
};

GuankaData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

GuankaData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};