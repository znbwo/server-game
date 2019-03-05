//邮件
var MailsData = function () {
    this.attrib = [];
};

module.exports = MailsData;

MailsData.prototype.setAllAttrib = function (data) {
    this.attrib = data;
};

MailsData.prototype.getAttrib = function () {
    return this.attrib;
};


MailsData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};