var async = require('async');
var userDb = require('./../../../mysql/userDb');
var code = require('./../../../domain/gameData/code');
var gameEnume = require('./../../../domain/gameData/gameEnume');
var pomelo = require('pomelo');
module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.startGame = function (msg, session, next) {
    var self = this;
    /*var username = msg.username;
     var password = msg.password;
     //var IsEnter =  msg.IsEnter;
     var pType =  msg.pType;*/
    var token = msg['d'][0];//uid
    //var isReconnect = msg['d'][1];// 1重连 0不重连
    /*var username = msg['d'][0];
     var password = msg['d'][1];
     var pType = msg['d'][2];*/
    var zid = 2;//msg.zid;
    var uid;
    if (!token) {
        return (next(null, {code: code.USER.FA_TOKEN_ERROR}));
    }
    async.waterfall([
        function (cb) {
            // auth token
            self.app.rpc.auth.authRemote.auth(session, token, cb);
        }, function (newCode, user, cb) {
            if (newCode !== code.OK) {
                next(null, {code: newCode});
                return;
            }
            if (!user) {
                next(null, {code: code.USER.FA_USER_NOT_EXIST});
                return;
            }
            uid = user[gameEnume.userAttrib.USER_ATTRIB_UID];
            cb();
        }, function (cb) {
            var sessionService = self.app.get('sessionService');
            var sessions = sessionService.getByUid(uid);
            if (sessions) {
                //通知原有账号被顶号
                session.set('uid', uid);
                self.app.rpc.game.gameRemote.kickByAnother(session, uid, self.app.get('serverId'), cb);
            } else {
                cb();
            }
        }, function (cb) {
            self.app.get('sessionService').kick(uid, cb);
        }, function (cb) {
            session.bind(uid, cb);
        }, function (cb) {
            session.set('conserverid', self.app.getServerId());
            session.set('uid', uid);
            session.on('closed', onUserLeave.bind(null, self.app));
            session.pushAll(cb);
        }, function (cb) {
            self.app.rpc.game.gameRemote.add(session, uid, self.app.get('serverId'), zid, cb);
        }
    ], function (err) {
        if (err) {
            next(err, {code: code.FAIL});
            return;
        }
        next(null, {code: code.OK});
    });
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function (app, session) {
    if (!session || !session.uid) {
        return;
    }

    //console.log('lifei test.', session.get('uid'), app.getServerId());

    app.rpc.game.gameRemote.userLeave(session, session.get('uid'), app.getServerId(), function (err) {
        if (!!err) {
            console.log('user leave error! %j', err);
        }
    });
    //app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};

var bindUserAddGame = function (self, session, uid, zid, next) {
    session.bind(uid, function () {
        session.set('uid', uid);
        session.set('conserverid', self.app.getServerId());
        session.on('closed', onUserLeave.bind(null, self.app));
        session.pushAll(function (err) {
            if (err) {
                next(null, {code: code.SERVER.FA_CON_BIND_ERROR});
                console.error('set uid for session service failed! error is : %j', err.stack);
            }
            console.log("---------", self.app.get('serverId'));
            //通知登陆游戏服务器
            self.app.rpc.game.gameRemote.add(
                session, uid, self.app.get('serverId'), zid, next
            );
        });
    });
}