var userDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');

var BaseDao = require('./baseDb');
var CardDao = require('./cardDb');
var MailDao = require('./mailDb');
var ShopDao = require('./shopDb');
var GuankaDao = require('./guanKaDb');
var BoxDao = require('./boxDb');
var AchieveDao = require('./achieveDb');
var prefix = {
    "zoneList": "zoneList:",                // 服务器分区前缀
    "genSumRank": "user:sumGeneralScore",   // 常规总积分
    "limSumRank": "user:sumLimitScore",     // 限时总积分
    "sumRank": "user:sumScore",             // 总积分
}

// 获取服务器分区列表 先从缓存中查取，若有直接返回，没有再从MySQL中读取，再存入缓存中
userDao.getZoneList = function (app, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    var self = this;
    redisDbHandle.getAll(prefix.zoneList, function (isCache, data) {
        var newRes = [];
        if (!isCache) {//缓存中没有
            self.getZoneListMysql(app, function (err, res) {
                if (!!err) {
                    utils.invokeCallback(cb, err, null);
                }
                if (res.length < 1) {
                    utils.invokeCallback(cb, null, newRes);
                }
                if (res.length > 1) {
                    for (var i = 0; i < res.length; i++) {
                        newRes[res[i]['zid']] = _.values(res[i]); //k v => [v]
                        redisDbHandle.add(prefix.zoneList + res[i]['zid'], JSON.stringify(res[i]));//加入缓存
                    }
                    utils.invokeCallback(cb, null, newRes);
                }
            });
        } else {
            for (var i = 0; i < data.length; i++) {
                newRes[data[i]['zid']] = _.values(data[i]); //k v => [v]
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

userDao.getZoneListMysql = function (app, cb) {
    var userDb = app.get('userDbHandle');
    var sql = 'call zoneList()';
    var args = [];
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('getZoneList failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res[0]);
        }
    });
}

userDao.checkGameVersion = function (app, cid, curVersion, cb) {
    var userDb = app.get('userDbHandle');
    var sql = 'call checkGameVersion(?,?)';
    var args = [cid, curVersion];
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('checkGameVersion failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 检测用户是否有效
/*userDao.checkUser = function (app, username, password, ptype, cb) {
    var sql = 'call CheckUser(?,?,?)';
    var args = [username, password, ptype];
    console.log('args', args);
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('checkUser failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}*/
// 注册用户
/*userDao.registerUser = function (app, username, password, ptype, cb) {
    var sql = 'call RegisterUser(?,?,?)';
    var args = [username, password, ptype];

    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('registerUser failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}*/

// 玩家下线
userDao.updateUser = function (app, data, cb) {
    var sql = 'call updateUser(?,?,?,?,?,?)';
    var args = data;
    console.log('args', data);
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('leaveUser failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

/*//加载用户信息
userDao.getUserByUid = function (app, uid, cb) {
    var sql = 'call getUserByUid(?)';
    var args = [uid];
    console.log('args', args);
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('getUserByUid failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            if(err !== null){
                utils.invokeCallback(cb, err.message, null);
            } else if (!res || res.length <= 0){
                utils.invokeCallback(cb,null,[]);
                return;
            } else{
                var newRes = _.values(res[0][0]);
                utils.invokeCallback(cb,null, newRes);
            }
        }
    });
}*/

// 检查帐户是否有角色
userDao.checkPlayerRole = function (app, uid, cb) {
    var sql = 'call checkPlayerRole(?)';
    var args = [uid];

    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('checkPlayerRole failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
// 更新人物角色
userDao.updatePlayerRole = function (app, data, cb) {
    var sql = 'call updatePlayerRole(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';//24
    var args = data;

    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('updatePlayerRole failed! ' + data+ err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
// 更新人物角色
userDao.updatePlayerRoleNickName = function (app, data, cb) {
    var sql = 'call updatePlayerNickName(?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('updatePlayerRoleNickName failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

// 加载人物角色详细信息
userDao.getPlayer = function (app, uid, cb) {
    var sql = 'call getPlayerRoleByPid(?)';
    var args = [uid];

    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('getPlayerRoleByPid failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            if(err !== null){
                utils.invokeCallback(cb, err.message, null);
            } else if (!res || res.length <= 0){
                utils.invokeCallback(cb,null,[]);
                return;
            } else{
                var newRes = _.values(res[0][0]);
                utils.invokeCallback(cb,null, newRes);
            }
        }
    });
}

// 加载人物荣誉信息
userDao.getPlayerHonor = function (app, pid, cb) {
    var sql = 'call getPlayerHonorByPid(?)';
    var args = [pid];

    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for(var i = 0; i < res[0].length; i++){
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

// 更新荣誉
userDao.updatePlayerHonor = function (app, data, cb) {
    var sql = 'call updatePlayerHonor(?,?,?,?,?)';
    var args = data;
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err) {
            logger.error('updatePlayerHonor failed! ' + err.stack);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}

userDao.getPlayerAllInfo = function (app, uid, pid, cb) {
    var self = this;
    async.parallel([
            function(callback){
                self.getUserById(app, uid, function(err, player) {
                    if(!!err || !player) {
                        logger.error('Get getUserById for userDao failed! ' + err.stack);
                    }
                    callback(err,player);
                });
            },
            function(callback){
                self.getPlayer(app, pid, function(err, player) {
                    if(!!err || !player) {
                        logger.error('Get player for userDao failed! ' + err.stack);
                    }
                    callback(err,player);
                });
            },
            function(callback){
                BaseDao.getPlayerBaseByPid(app, pid, function(err, player) {
                    if(!!err || !player) {
                        logger.error('Get base for BaseDao failed! ' + err.stack);
                    }
                    callback(err,player);
                });
            },
            function(callback) {
                CardDao.getPlayerCardByPid(app, pid, function(err, characters) {
                    if(!!err || !characters) {
                        logger.error('Get card for CardDao failed! ' + err.stack);
                    }
                    callback(err,characters);
                });
            },
            function(callback) {
                CardDao.getPlayerCardGroupByPid(app, pid, function(err, characters) {
                    if(!!err || !characters) {
                        logger.error('Get cardGroup for CardDao failed! ' + err.stack);
                    }
                    callback(err,characters);
                });
            },
            function(callbaclk) {
                MailDao.getPlayerMails(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get userMail for MailDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {
                ShopDao.getPlayerShop(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get userShop for ShopDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {
                GuankaDao.getPlayerGuanQiaByPid(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get Guanka for GuankaDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {
                BoxDao.getPlayerBox(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get userBox for BoxDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {
                AchieveDao.getPlayerAchieveByPid(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get getPlayerAchieveByPid for AchieveDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {
                AchieveDao.getPlayerNoteByPid(app,pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get getPlayerNoteByPid for AchieveDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
            function(callbaclk) {//荣誉
                self.getPlayerHonor(app, pid,function(err,res){
                    if(!!err || !res) {
                        logger.error('Get getPlayerHonor for userDao failed! ' + err.stack);
                    }
                    callbaclk(err, res);
                });
            },
        ],
        function(err, results) {
            if (!!err){
                utils.invokeCallback(cb, err);
            } else {
                utils.invokeCallback(cb, null, results);
            }
        });
};
// 获取玩家排行数据
userDao.getGameUserRankInfoByPid = function (app, pid, cb) {
    var sql = 'call getRankInfoByPid(?)';
    var args = [pid];
    var gameDb = app.get('gameDbHandle');
    gameDb.execQuery(sql, args, function (err, res) {
        if (err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb, null, null);
        } else {
            var newRes = [];
            for(var i = 0; i < res[0].length; i++){
                newRes.push(_.values(res[0][i]));
            }
            utils.invokeCallback(cb, null, newRes);
        }
    });
}

userDao.getUserByName = function (app, username, Ptype, cb){
    var sql = 'select * from  user where name = ? AND `from` = ?';
    var args = [username, Ptype];
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if(err !== null){
            cb(err.message, null);
        } else {
            if (!!res && res.length === 1) {
                var rs = res[0];
                var user = {id: rs.UID, name: rs.name, password: rs.password, from: rs.from};
                cb(null, user);
            } else {
                cb(' user not exist ', null);
            }
        }
    });
};

userDao.createUser = function (app, username, password, from, cb){
    var sql = 'insert into user (name,password,`from`,loginCount,lastLoginTime) values(?,?,?,?,?)';
    var loginTime = Date.now();
    var args = [username, password, from || 0, 1, loginTime];
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if(err !== null){
            cb({code: err.number, msg: err.message}, null);
        } else {
            var userId = res.insertId;
            var user = {id: userId, name: username, password: password, loginCount: 1, lastLoginTime:loginTime};
            cb(null, user);
        }
    });
};

userDao.getUserById = function (app, uid, cb){
    var sql = 'select * from user where UID = ?';
    var args = [uid];
    var userDb = app.get('userDbHandle');
    userDb.execQuery(sql, args, function (err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0){
            utils.invokeCallback(cb,' user not exist ', []);
            return;
        } else{
            var newRes = _.values(res[0]);
            utils.invokeCallback(cb,null, newRes);
        }
    });
};