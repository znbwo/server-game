
var gameEnume = require('./gameEnume');
var BoxData = function () {
    this.attrib = [];
};

module.exports = BoxData;

BoxData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

BoxData.prototype.getAttrib = function () {
    return this.attrib;
};

BoxData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

BoxData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};