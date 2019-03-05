var ArenaCache = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var gameEnume = require('../domain/gameData/gameEnume');
var _ = require('underscore')._;
var async = require('async');
var prefix = {
    // "zoneList": "zoneList:",                // 服务器分区前缀
    // "genSumRank": "user:sumGeneralScore",   // 常规总积分
    // "limSumRank": "user:sumLimitScore",     // 限时总积分
    // "sumRank": "user:sumScore",             // 总积分
    // "nicknamemap": "user:nicknamemap",      // 昵称
    "arenaRank": "user:arenaRank",
    "pidsByLevel": "user:pidsByLevel:",
    "playersInfo": "user:playersInfo",
}


//获取前X排名
ArenaCache.getRankList = function (app, rankNum, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zrevRangeWithScore(prefix.arenaRank, 0, rankNum, function (err, res) {
        if (!!err) {
            logger.error('getRank ArenaCache failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}


//添加积分
ArenaCache.addScore = function (app, score, pid) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zAdd(prefix.arenaRank, score, pid);
}

//获取当前排名
ArenaCache.getUserRank = function (app, pid, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zrevRank(prefix.arenaRank, pid, function (err, res) {
        if (!!err) {
            logger.error('getUserRank ArenaCache failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
ArenaCache.updatePlayerInfo = function (app, data, isUpgradeLevel) {
    var redisDbHandle = app.get('redisDbHandle');
    var pid = data[gameEnume.redis.playerInfo.pid];
    redisDbHandle.redis.HSET(prefix.playersInfo, pid, JSON.stringify(data), function (err) {
        if (err) {
            logger.error('addPlayerInfo ArenaCache failed! the pid is %d', pid);
        }
    });
    if (isUpgradeLevel) {
        var level = data[gameEnume.redis.playerInfo.level];
        this.movePidByLevel(app, --level, level, pid);
    }
}
ArenaCache.addPlayerInfo = function (app, data) {
    var redisDbHandle = app.get('redisDbHandle');
    var pid = data[gameEnume.redis.playerInfo.pid];
    var level = data[gameEnume.redis.playerInfo.level];
    redisDbHandle.redis.HSET(prefix.playersInfo, pid, JSON.stringify(data), function (err) {
        if (err) {
            logger.error('addPlayerInfo ArenaCache failed! the pid is %d', pid);
        }
    });
    this.addPidByLevel(app, level, pid);
}
ArenaCache.addPidByLevel = function (app, level, pid) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.redis.SADD(prefix.pidsByLevel + level, pid, function (err) {
        if (err) {
            logger.error('addPidByLevel ArenaCache failed!' + err.stack);
        }
    });
}

ArenaCache.movePidByLevel = function (app, oldLevel, newLevel, pid) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.redis.SMOVE(prefix.pidsByLevel + oldLevel, prefix.pidsByLevel + newLevel, pid, function (err) {
        if (err) {
            logger.error('updatePidByLevel ArenaCache failed!' + err.stack);
        }
    });
}
ArenaCache.getRandomPidsByLevel = function (app, level, num, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.redis.SRANDMEMBER(prefix.pidsByLevel + level, num, function (err, res) {
        if (!!err) {
            logger.error('getPidsByLevel ArenaCache failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
ArenaCache.getOpponentPlayersInfoByLevel = function (app, level, num, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    var self = this;
    async.waterfall([function (callback) {
        self.getRandomPidsByLevel(app, level, num, function (err, res) {
            if (!err) {
                callback(null, res);
            } else {
                callback(err);
            }
        });
    }, function (res, callback) {
        if (res && res.length > 0) {
            redisDbHandle.redis.HMGET(prefix.playersInfo, res, function (err, res) {
                if (!err) {
                    var result = [];
                    for (var i = 0; i < res.length; i++) {
                        if (!res[i]) {
                            logger.error('playersInfo have value don\'t exist while pidsByLevel have..', res);
                        } else {
                            var playerInfo = JSON.parse(res[i]);
                            playerInfo.push(0);//防守胜利次数
                            playerInfo.push(0);//战斗记录（0未打，-1负，1胜）
                            result.push(playerInfo);
                        }
                    }
                    callback(null, result);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(null, []);
        }
    }], function (error, result) {
        if (error) {
            logger.error(error.stack());
            utils.invokeCallback(cb, error);
        } else {
            utils.invokeCallback(cb, null, result);
        }

    });
}
// ArenaCache.getOpponentPlayersInfoByLevel = function (app, level, num, cb) {
//     var redisDbHandle = app.get('redisDbHandle');
//     this.getRandomPidsByLevel(app, level, num, function (err, res) {
//         if (err) {
//             utils.invokeCallback(cb, err);
//             logger.error('getOpponentPlayersInfoByLevel ArenaCache failed!' + err.stack);
//         } else {
//             if (!(res && res.length > 0)) {
//                 utils.invokeCallback(cb, null, null);
//             } else {
//                 redisDbHandle.redis.HMGET(prefix.playersInfo, res, function (err2, res2) {
//                     if (err2) {
//                         logger.error('getOpponentPlayersInfoByLevel ArenaCache failed!' + err2.stack);
//                         utils.invokeCallback(cb, err);
//                     } else {
//                         var result = [];
//                         for (var i = 0; i < res2.length; i++) {
//                             if (!res2[i]) {
//                                 logger.error('playersInfo have value don\'t exist while pidsByLevel have..', res);
//                             } else {
//                                 var playerInfo = JSON.parse(res2[i]);
//                                 playerInfo.push(0);//防守胜利次数
//                                 playerInfo.push(0);//战斗记录（0未打，-1负，1胜）
//                                 result.push(playerInfo);
//                             }
//                         }
//                         utils.invokeCallback(cb, null, result);
//                     }
//                 });
//             }
//         }
//     });
// }

//更新排名昵称
ArenaCache.updateUserNickName = function (app, pid, nickname) {
    var redisDbHandle = app.get('redisDbHandle');
    var obj = {};
    redisDbHandle.getOne(prefix.nicknamemap, function (err, res) {
        if (res) {
            var nickMap = JSON.parse(res);
            if (!(nickMap[pid] && nickMap[pid] == nickname)) {
                nickMap[pid] = nickname;
                redisDbHandle.add(prefix.nicknamemap, JSON.stringify(nickMap));
            }
        } else {
            obj[pid] = nickname;
            redisDbHandle.add(prefix.nicknamemap, JSON.stringify(obj));
        }
    });
}