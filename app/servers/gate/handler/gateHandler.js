var dispatcher = require('../../../util/dispatcher');
var pomelo = require('pomelo');
var userDb = require('../../../mysql/userDb');
var code = require('../../../domain/gameData/code');
var gameEnume = require('../../../domain/gameData/gameEnume');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.testRoute = function (msg, session, next) {
    console.log('testRoute', msg);;
    next(null, {code:code.OK})
    return;
}

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.registerUser = function (msg, session, next) {
    var username = msg['d'][0];
    var password = msg['d'][1];
    var pType = parseInt(msg['d'][2]);
    var zid = 2;//msg.zid;

    var pGameDataMgr = this.app.get('gameDataMgr');

    if (pGameDataMgr == undefined) {
        return;
    }
    if (!zid) {
        next(null, {code: code.SERVER.FA_NO_ZONE_DATA});
        return;
    }
    //输入的用户名为空
    if (!username) {
        next(null, {code: code.USER.FA_USER_BLANK});
        return;
    }
    //输入的密码为空
    if (!password) {//pType == 0 &&
        next(null, {code: code.USER.FA_PASSWORD_BLANK});
        return;
    }

    //检查用户名和密码正确性
    userDb.registerUser(this.app, username, password, pType, function (err, res) {
        if(!!err){
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        if (res && res.length >= 2) {
            var result = res[0];
            var eCode = result[0].ECode;
            var uid = result[0].OUID;
            if (eCode != 0) {//注册失败
                next(null, {code: code.USER.FA_USERNAME_REPEAT});
                return false;
            }

            //var connectors = pomelo.app.getServersByType('connector');
            var connectors = pGameDataMgr.userMgr.zoneDates[zid];
            if (!connectors || connectors.length === 0) {
                //通知服务器维护中
                next(null, {code: code.SERVER.FA_NO_SERVER_AVAILABLE});
                return;
            }
            connectors = JSON.parse(connectors[gameEnume.ZoneEnumAtt.ZoneEnumAtt_conn]);
            //选择可连接的服务器
            var res = dispatcher.dispatch(uid, connectors);
            //通知客户端进游戏
            var clientip = res.clientHost;
            if (!clientip)
                clientip = res.host;
            next(null, {
                //code: code.OK, d:{ uid: uid,host: clientip,port: res.clientPort,zid:zid }
                code: code.OK, d:[uid, clientip, res.clientPort, zid]
            });
            return;
        }
    });
}

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.checkUser = function (msg, session, next) {
    if(msg['d'].length != 3){
        console.log('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

    var username = msg['d'][0];
    var password = msg['d'][1];
    var pType = parseInt(msg['d'][2]);
    var zid = 2;//msg.zid;
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameDataMgr == undefined) {
        return;
    }


    if (!zid) {
        next(null, {code: code.SERVER.FA_NO_ZONE_DATA});
        return;
    }
    //输入的用户名为空
    if (!username) {
        next(null, {code: code.USER.FA_USER_BLANK});
        return;
    }
    if(pType == 0){
        //输入的密码为空
        if (!password) {//pType == 0 &&
            next(null, {code: code.USER.FA_PASSWORD_BLANK});
            return;
        }
    } else {
        //验证第三方登录
        var request = require('request');
        var sdk = msg.sdk;
        var appId = msg.app;
        var uin = msg.uin;
        var sess = msg.sess;
        var reqUrl = 'http://sync.1sdk.cn/login/check.html?sdk='+sdk+'&app='+appId+'&uin='+uin+'&sess='+sess;
        request({uri:reqUrl}, function(err, response, body) {
            console.log('err', err);
            if(err || response.statusCode != 200){
                console.log('用户登录失败');
                next(null, {code: code.USER.FA_LOGIN_ERROR});
                return;
            }
            if(body === 0){
                console.log('用户已经登录');
                next(null, {code: code.USER.FA_USER_ONLINE});
                return;
            }
            console.log('第三方用户验证通过');
        })
    }
    //检查用户名和密码正确性
    userDb.checkUser(this.app, username, password, pType, function (err, res) {
        if(!!err){
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        if (res && res.length >= 2) {
            var result = res[0];
            var eCode = result[0].ECode;
            var uid = result[0].OUID;
            if (eCode === 1) {
                if(pType == 0){
                    next(null, {code: code.USER.FA_USER_NOT_EXIST});
                    return;
                }
            }
            /*if (eCode === 2) {
            next(null, {code: code.ENTRY.FA_USER_ONLINE});
            return;
        }*/
        //var connectors = pomelo.app.getServersByType('connector');
            var connectors = pGameDataMgr.userMgr.zoneDates[zid];
            if (!connectors || connectors.length === 0) {
                //通知服务器维护中
                next(null, {code: code.SERVER.FA_NO_SERVER_AVAILABLE});
                return;
            }
            connectors = JSON.parse(connectors[gameEnume.ZoneEnumAtt.ZoneEnumAtt_conn]);
            console.log('-----------------before connectors', connectors);
            //选择可连接的服务器
            var res = dispatcher.dispatch(uid, connectors);
            console.log('-----------------before res', res);
            //通知客户端进游戏
            var clientip = res.clientHost;
            //var clientip = res.host;
            if (!clientip)
                clientip = res.host;
            next(null, {
                //code : code.OK, d: {uid : uid, host: clientip, port: res.clientPort, zid:zid}
                code: code.OK, d:[uid, clientip, res.clientPort, zid]
            });
            return;
        }
    });
};

Handler.prototype.queryEntry = function(msg, session, next) {
    var uid = msg['d'][0];
    var zid = 2;
    if(!uid) {
        next(null, {code: code.FAIL});
        return;
    }
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameDataMgr == undefined) {
        return;
    }

    var connectors = pGameDataMgr.userMgr.zoneDates[zid];
    if (!connectors || connectors.length === 0) {
        //通知服务器维护中
        next(null, {code: code.SERVER.FA_NO_SERVER_AVAILABLE});
        return;
    }
    connectors = JSON.parse(connectors[gameEnume.ZoneEnumAtt.ZoneEnumAtt_conn]);
    console.log('-----------------before connectors', connectors);
    //选择可连接的服务器
    var res = dispatcher.dispatch(uid, connectors);
    console.log('-----------------before res', res);
    var clientip = res.clientHost;
    if (!clientip)
        clientip = res.host;
    next(null, {
        code: code.OK, d:[uid, clientip, res.clientPort, zid]
    });
};

/**
 *
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.zoneList = function (msg, session, next) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    var zoneList = pGameDataMgr.userMgr.zoneDates;
    var returnData = [];
    for (var i in zoneList) {
        returnData.push([zoneList[i][gameEnume.ZoneEnumAtt.ZoneEnumAtt_id],zoneList[i][gameEnume.ZoneEnumAtt.ZoneEnumAtt_name]]);
    }
    next(null, {
        code: code.OK,
        zoneList: returnData
    });
    return;
};

/**
 * 检查版本更新
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.checkVersion = function (msg, session, next) {
    var curClientVersion = msg.ves;
    var pType = msg.pType;
    var need_update = 0;
    //检验参数
    if(!curClientVersion || !pType){
        next(null, {
            code : code.FAIL
        });
        return;
    } else {
        curClientVersion = parseFloat(curClientVersion);
        pType = parseInt(pType);
        if(curClientVersion == NaN || pType == NaN){
            next(null, {
                code : code.FAIL
            });
            return;
        }
    }
    userDb.checkGameVersion(this.app, pType, curClientVersion, function(err, res){
        if(!!err){
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        var result = res[0];
        var eCode = result[0].ECode;
        var OURL = result[0].OURL;
        if (eCode === 1) {
            next(null, {
                code : code.OK,
                isUpdate : need_update,
                url : OURL
            });
            return;
        } else {
            need_update = 1;
            next(null, {//d : {isUpdate : need_update, url : OURL}
                code : code.OK, d : [need_update, OURL]
            });
            return;
        }
    })
};