//ÏûÏ¢¸½¼þ
var MailAttachData = function () {
    this.attrib = [];
};

module.exports = MailAttachData;

MailAttachData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

MailAttachData.prototype.getAttrib = function () {
    return this.attrib;
};

MailAttachData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};