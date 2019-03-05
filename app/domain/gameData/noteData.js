
var gameEnume = require('./gameEnume');
var NoteData = function () {
    this.attrib = [];
};

module.exports = NoteData;

NoteData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

NoteData.prototype.getAttrib = function () {
    return this.attrib;
};

NoteData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

NoteData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};