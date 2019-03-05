var utils = require('../../../util/utils');
module.exports = function (app) {
    return new gameRemote(app);
};

var gameRemote = function (app) {
    this.app = app;
    this.channelService = app.get('channelService');

};

/**
 * Add user into chat channel.
 * @param {String} uid unique id for user
 */

gameRemote.prototype.add = function (uid, conserverid, zid, next) {
    var pUserLogic = this.app.get('UserLogic');
    // 用户进入游戏处理
    pUserLogic.userStartGame(uid, conserverid, zid, next);
};

/**
 * Kick user out chat channel.
 * @param {Number} uid unique id for user
 */
gameRemote.prototype.userLeave = function (uid, sid, cb) {
    // 用户离开游戏
    var pUserLogic = this.app.get('UserLogic');
    // 用户进入游戏处理
    pUserLogic.userLeave(uid, sid);
    utils.invokeCallback(cb);
};

/**
 * Kick user out chat channel.
 * @param {Number} uid unique id for user
 */
gameRemote.prototype.kickByAnother = function (uid, sid,cb) {
    var pUserLogic = this.app.get('UserLogic');
    pUserLogic.kickByAnother(uid, sid);
    utils.invokeCallback(cb);
};
