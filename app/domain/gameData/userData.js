/**
 * Initialize a new 'Player' with the given 'opts'.
 *
 * @param {Object} opts
 * @api public
 */
var userData = function (uid) {
    this.uid = uid;
    this.conServerID = 0;                  //连接服务器ID 前端服务器ID
    this.currTime = 0;                     //当前时间
    this.attrib = [];                      //用户属性
    this.playerRoleDataMgr = {};           //用户角色的全部信息
    this.bettle = [];                      //战斗数据
};

module.exports = userData;

userData.prototype.getOneAttrib = function (index) {
    return this.attrib[index];
};


userData.prototype.getAttrib = function () {
    return this.attrib;
};

userData.prototype.setAttrib = function (attribId, value) {
    this.attrib[attribId] = value;
};

userData.prototype.setAllAttrib = function (value) {
    this.attrib = value;
};

userData.prototype.setConServerID = function (sid) {
    this.conServerID = sid;
};

userData.prototype.getConServerID = function () {
    return this.conServerID;
};


userData.prototype.addPlayerRoleData = function( roleData )
{
    this.playerRoleDataMgr = roleData;
}

userData.prototype.getPlayerRoleData = function()
{
    return this.playerRoleDataMgr;
}

userData.prototype.getCurrTime = function () {
    return this.currTime;
};

userData.prototype.setCurrTime = function (time) {
    console.log('timeStamp', time);
    this.currTime = time;//new Date().getTime();
}

userData.prototype.setBettle = function (index, val) {
    this.bettle[index] = val;
}
userData.prototype.getBettle = function (index) {
    return this.bettle[index];
}