var CacheDao = module.exports;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../util/utils');
var _ = require('underscore')._;
var async = require('async');
var prefix = {
    "zoneList": "zoneList:",                // 服务器分区前缀
    "genSumRank": "user:sumGeneralScore",   // 常规总积分
    "limSumRank": "user:sumLimitScore",     // 限时总积分
    "sumRank": "user:sumScore",             // 总积分
    "nicknamemap": "user:nicknamemap",      // 昵称
}

//清空积分
CacheDao.prefix = function () {
    return prefix;
}

//获取前X排名
CacheDao.getRank100 = function (app, keys, rankNum, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zrevRangeWithScore(keys, 0, rankNum, function(err, res){
        if (!!err) {
            logger.error('getCacheGenRank CacheDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}
//获取前X极限排名
CacheDao.getRankLimit = function (app, keys, min, start, rankNum, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    var max = 100000000000000000;//18位
    redisDbHandle.zrevRangeByScore(keys, max, min, start, rankNum, function(err, res){
        if (!!err) {
            logger.error('getCacheGenRank CacheDao failed!' + err.stack);
            utils.invokeCallback(cb, err);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}


//清空积分
CacheDao.truncateCityScore = function (app, keys) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.delete(keys);
}

//添加积分
CacheDao.addScore = function (app, cityId, keys, score, ukeys, isPassNextCity) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zScore(keys, ukeys, function(err, res){
        var sumScore;
        if(res){
            var deScore = utils.getDeScore(res);
            sumScore = score + deScore;
        } else {
            sumScore = score;
        }
        var enScore = utils.getEnScore(sumScore);
        redisDbHandle.zAdd(keys, enScore, ukeys);
    });
    redisDbHandle.zScore(keys + cityId +'-'+ isPassNextCity, ukeys, function(err, res){
        var sumScore = res;
        if(res){
            if(isPassNextCity == 1){//删除首次排行榜
                redisDbHandle.zRem(keys + cityId +'-'+ 0, ukeys);
            }
            var deScore = utils.getDeScore(res);
            if(score > deScore){
                sumScore = score;
                var enScore = utils.getEnScore(sumScore);
                redisDbHandle.zAdd(keys + cityId +'-'+ isPassNextCity, enScore, ukeys);
            }
        } else {
            sumScore = score;
            var enScore = utils.getEnScore(sumScore);
            redisDbHandle.zAdd(keys + cityId +'-'+ isPassNextCity, enScore, ukeys);
        }

    });
    redisDbHandle.zScore(prefix.sumRank, ukeys, function(err, res){
        var sumScore = res;
        if(res){
            var deScore = utils.getDeScore(res);
            sumScore = score + deScore;
        } else {
            sumScore = score;
        }
        var enScore = utils.getEnScore(sumScore);
        redisDbHandle.zAdd(prefix.sumRank, enScore, ukeys);
    });
    /*redisDbHandle.zIncrby(keys + cityId +'-'+ isPassNextCity, score, ukeys);
    redisDbHandle.zIncrby(prefix.sumRank, score, ukeys);*/
}

//获取当前排名
CacheDao.getUserRank = function (app, keys, ukeys, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.zrevRank(keys, ukeys, cb);
}

//更新排名昵称
CacheDao.updateUserNickName = function (app, pid, nickname) {
    var redisDbHandle = app.get('redisDbHandle');
    var obj = {};
    redisDbHandle.getOne(prefix.nicknamemap, function(err, res){
        if(res){
            var nickMap = JSON.parse(res);
            if(!(nickMap[pid] && nickMap[pid] == nickname)){
                nickMap[pid] = nickname;
                redisDbHandle.add(prefix.nicknamemap, JSON.stringify(nickMap));
            }
        } else {
            obj[pid] = nickname;
            redisDbHandle.add(prefix.nicknamemap, JSON.stringify(obj));
        }
    });
}
//获取排名昵称
CacheDao.getUserNickName = function (app, cb) {
    var redisDbHandle = app.get('redisDbHandle');
    redisDbHandle.getOne(prefix.nicknamemap, cb);
}