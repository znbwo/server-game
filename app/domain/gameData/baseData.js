var BaseData = function () {
    this.attrib = [];
};

module.exports = BaseData;

BaseData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

BaseData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};

BaseData.prototype.getAttrib = function () {
    return this.attrib;
};

BaseData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};