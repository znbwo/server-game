var userDao = require('./../../../mysql/userDb');
var code = require('./../../../domain/gameData/code');
var utils = require('./../../../util/utils');
module.exports = function (app, http) {
    http.post('/login', function (req, res) {
        var msg = req.body;
        //var d = msg.d;
        console.log(msg);
        var username = msg["name"];
        var pwd = msg["password"];
        var from = msg["type"];//msg.pType;
        var serverTime = utils.getCurrTime();
        //输入的用户名为空
        if (!username) {
            res.json({code: code.USER.FA_USER_BLANK});
            return;
        }
        if (from > 0) {
            //验证第三方登录
            /*var request = require('request');
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
             })*/
            userDao.getUserByName(app, username, from, function (err, user) {
                if (err) {
                    console.log('username not exist!');
                    res.json({code: code.USER.FA_USER_NOT_EXIST});
                    return;
                }
                if (!user) {
                    //插入
                    userDao.createUser(app, username, pwd, from, function (err, newUser) {
                        if (err || !newUser) {
                            console.error(err);
                        }
                        console.log(username + ' login!');
                        res.json({code: code.OK, d: [newUser.id, serverTime]});
                    })
                } else {
                    console.log(username + ' login!');
                    res.json({code: code.OK, d: [user.id, serverTime]});
                }
            });
        } else {
            //输入的密码为空
            if (!pwd) {
                res.json({code: code.USER.FA_PASSWORD_BLANK});
                return;
            }
            userDao.getUserByName(app, username, from, function (err, user) {
                if (err || !user) {
                    console.log('username not exist!');
                    res.json({code: code.USER.FA_USER_NOT_EXIST});
                    return;
                }
                if (pwd !== user.password) {
                    // password is wrong
                    console.log('password incorrect!');
                    res.json({code: code.USER.FA_PASSWORD_ERROR});
                    return;
                }
                console.log(username + ' login!');
                res.json({code: code.OK, d: [user.id, serverTime]});//token: Token.create(user.id, Date.now(), secret),
            });
        }
    });

    http.post('/register', function (req, res) {
        var msg = req.body;
        console.log(msg);
        //var d = msg.d;
        var username = msg["name"];
        var pwd = msg["password"];
        var from = msg["type"];//msg.pType;
        var serverTime = utils.getCurrTime();
        var reg = /^(\w){8,16}$/;
        if (!reg.test(username)) {
            res.json({code: code.USER.FA_NAME_ERROR});
            return;
        }

        if (!reg.test(pwd)) {
            res.json({code: code.USER.FA_PWD_ERROR});
            return;
        }

        userDao.getUserByName(app, username, from, function (err, user) {
            if (user) {
                res.json({code: code.USER.FA_USERNAME_REPEAT});
                return;
            } else {
                //插入
                userDao.createUser(app, username, pwd, from, function (err, newUser) {
                    if (err || !newUser) {
                        console.log(err, newUser);
                        res.json({code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    console.log('A new user was created! --' + username);
                    res.json({code: code.OK, d: [newUser.id, serverTime]});
                    return;
                })
            }
        });
    });
};