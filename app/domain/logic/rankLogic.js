var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var utils = require('../../util/utils');
var CacheDb = require('../../redis/cacheDb');
var userDb = require('../../mysql/userDb');
var RankLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = RankLogic;

// 获取总排名
RankLogic.prototype.getSumRank = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    //var pConstantTable = pGameMgr.TableRound_Gold.GetElement(7);
    //var rankNum = pConstantTable.getValue_Constant() || 50;
    var rankNum = 50;
    var nickObj = {};
    async.series({
        One: function (callback) {
            CacheDb.getUserNickName(self.app, function(err, res){
                if(res){
                    nickObj = JSON.parse(res);
                }
                callback();
            })
        },
        two: function (callback) {
            CacheDb.getRank100(self.app, CacheDb.prefix()['genSumRank'], rankNum, function(err, res){
                var genData = self.dealUsersKeyFunc(res, nickObj);
                callback(null, genData);
            })
        },
        three: function (callback) {
            CacheDb.getRank100(self.app, CacheDb.prefix()['limSumRank'], rankNum, function(err, res){
                var limitData = self.dealUsersKeyFunc(res, nickObj);
                callback(null, limitData);
            })
        }
    }, function (err, results) {
        //console.log('ending...', err, results);
        next(null, {code: code.OK, d:[results.two, results.three]});
    });
}

// 获取城池排名
RankLogic.prototype.getCityRank = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var cityId = parseInt(msg['d'][0]);    //大关卡ID

    //动态数据检测
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pGuanka = pPlayerR.getGuanka(cityId);
    var isLimit = 0;//首次
    if(pGuanka && pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_NextLastGuan)){
        isLimit = 1;//极限
    }
    var startIndex = 0; //排名初始
    var limitScore;//极限排名
    /*var pConstantTable = pGameMgr.TableRound_Gold.GetElement(7);
     var rankNum = pConstantTable.getValue_Constant() || 100;*/

    var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
    if(!pCityGuanKaTable){
        logger.info('配表中该城池%d不存在', cityId);
        next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
        return;
    }
    var scoreArr = pCityGuanKaTable.getScore_Ranking();
    var rankNum = 50;
    var nickObj = {};
    async.series({
        one: function (callback) {
            CacheDb.getUserNickName(self.app, function (err, res) {
                if (res) {
                    nickObj = JSON.parse(res);
                }
                callback();
            })
        },
        two: function (callback) {
            var keys = CacheDb.prefix()['genSumRank'] + cityId + '-' + isLimit;
            if (isLimit == 0) {
                CacheDb.getRank100(self.app, CacheDb.prefix()['genSumRank'] + cityId + '-' + isLimit, rankNum, function (err, res) {
                    var genData = self.dealUsersKeyFunc(res, nickObj);
                    callback(null, genData);
                })
            } else if (isLimit == 1) {
                limitScore = scoreArr[0];
                var enScore = utils.getEnScore(limitScore);
                CacheDb.getRankLimit(self.app, keys, enScore, startIndex, rankNum, function (err, res) {
                    var genData = self.dealUsersKeyFunc(res, nickObj);
                    callback(null, genData);
                })
            }

        },
        three: function (callback) {
            var keys = CacheDb.prefix()['limSumRank'] + cityId + '-' + isLimit;
            if (isLimit == 0) {
                CacheDb.getRank100(self.app, keys, rankNum, function (err, res) {
                    var limData = self.dealUsersKeyFunc(res, nickObj);
                    callback(null, limData);
                })
            } else if (isLimit == 1) {
                limitScore = scoreArr[1];
                var enScore = utils.getEnScore(limitScore);
                CacheDb.getRankLimit(self.app, keys, enScore, startIndex, rankNum, function (err, res) {
                    var limData = self.dealUsersKeyFunc(res, nickObj);
                    callback(null, limData);
                })
            }
        }
    }, function (err, results) {
        //console.log('ending...', err, results);
        next(null, {code: code.OK, d:[isLimit, [results.two, results.three]]});
    });
}

// 获取排名详情
RankLogic.prototype.getRankInfo = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var pid = parseInt(msg['d'][0]);
    userDb.getGameUserRankInfoByPid(self.app, pid, function(err, res){
        console.log(err, res);
        next(null, {code: code.OK, d:res[0]});
        return;
    });
}

//处理user keys ['6#UID#玩家101', '119', '1#玩家102', '111', '12#玩家103', '56'];
RankLogic.prototype.dealUsersKeyFunc = function(arr, nickObj){
    var arrLen = arr.length;
    var newArr = [];
    var j=1;
    for(var i = 0; i < arrLen; i++){
        if((i%2) == 0){
            var userArr = arr[i].split('#');
            var deScore = utils.getDeScore(arr[i+1]);
            newArr.push([userArr[0], userArr[1], j, deScore, nickObj[userArr[0]]]);
            j++;
        }
    }
    return newArr;
}


// 发送数据到客户端
RankLogic.prototype.sendBaseTo_C = function (uid, pBase) {
    var route = 'OnSumRank';
    var data = {d: pBase.getAttrib()};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}