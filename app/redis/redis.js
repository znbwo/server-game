/**
 * Created with JetBrains WebStorm.
 * User: fei
 * Date: 16-4-27
 * Time: ����14:27
 * To change this template use File | Settings | File Templates.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var redis = require("redis");

var redisClient = function (app) {
    //this.app = app;
    var safe = this;
    var redisConfig = app.get('redis');
    this.redisConnected = false;
    this.redis = redis.createClient(redisConfig.port, redisConfig.host);
    this.redis.auth(redisConfig.auth);
    this.redis.select(redisConfig.db);
    this.getAll = function (prefix, cb) {
        var isCache = false;
        var self = this;
        this.redis.keys(prefix + '*', function (err, data) {
            if (data.length < 1) {
                cb(isCache, []);
                return;
            }
            self.redis.mget(data, function (err, data) {
                var maps = [];
                for (var i in data) {
                    if (!data[i]) continue;
                    maps.push(JSON.parse(data[i].toString()));
                }
                isCache = true;
                cb(isCache, maps);
            })
        });
    }
    this.getOne = function (keys, cb) {
        this.redis.get(keys, function (err, data) {
            cb(err, data);
        });
    }
    this.add = function (prefix, item) {
        this.redis.set(prefix, item);
    }

    // 删除
    this.delete = function (prefix) {
        this.redis.del(prefix);
    }
   //为有序集key的成员member的score值加上增量increment。
    this.zIncrby = function (prefix, step, pid) {
        this.redis.zincrby(prefix, step, pid);
    }
   //Redis Zadd 命令用于将一个或多个成员元素及其分数值加入到有序集当中。如果某个成员已经是有序集的成员，那么更新这个成员的分数值，并通过重新插入这个成员元素，来保证该成员在正确的位置上
    this.zAdd = function (prefix, score, pid) {
        this.redis.zadd(prefix, score, pid, function (err, result) {
            //console.log(err, result);
        });
    }
    //删除key中的元素
    this.zRem = function (prefix, member) {
        this.redis.zrem(prefix, member, function (err, result) {
            //console.log(err, result);
        });
    }
    //  odd index will hold its score
    //返回有序集key中，指定区间内的成员。其中成员的位置按score值递减(从大到小)来排列。
    this.zrevRangeWithScore = function (prefRix, start, end, cb) {
        this.redis.ZREVRANGE(prefRix, start, end, 'withScores', function (err, res) {
            cb(err, res);
        });
    }
    //返回有序集key中，成员member的score值。
    this.zScore = function (key, member, cb) {
        this.redis.ZSCORE(key, member, cb);
    }


    //  every index will give you member name
    //返回有序集key中，指定区间内的成员。其中成员的位置按score值递减(从小到大)来排列。
    this.zRange = function (prefRix, end, start, cb) {
        this.redis.zrange(prefRix, end, start, function (err, res) {
            cb(err, res);
        });
    }
    //获取玩家当前排名
    //返回有序集key中成员member的排名，其中有序集成员按score值从大到小排列。
    this.zrevRank = function (prefRix, pid, cb) {
        this.redis.ZREVRANK(prefRix, pid, function (err, res) {
            cb(err, res);
        });
    }

    //ZREVRANGEBYSCORE 返回有序集合中指定分数区间内的成员，分数由高到低排序。
    this.zrevRangeByScore = function (prefRix, max, min, start, count, cb) {
        this.redis.ZREVRANGEBYSCORE(prefRix, max, min, 'withScores', 'limit', start, count, function (err, res) {
            cb(err, res);
        });
    }

    this.redis.on("connect", function () {
        console.log('GS: Redis connected');
        safe.redisConnected = true;
    });

    this.redis.on("error", function (exception) {
        console.log('GS: Redis error: ' + exception);
    });

    this.redis.on("end", function () {
        console.log('GS: Redis disconnected');
        safe.redisConnected = false;
    });
}

module.exports = redisClient;
