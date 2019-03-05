/**
 * Created by Administrator on 2017/2/21 0021.
 * 竞技场
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var utils = require('../../util/utils');
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var ArenaDao = require('../../mysql/arenaDb');
var ArenaCache = require('../../redis/arenaCache');
var async = require('async');

var ArenaLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}
module.exports = ArenaLogic;

function isModuleOpened(pGameMgr, level) {
    var element = pGameMgr.TableFunctionOpen.GetElement(3);
    if (!element) {
        logger.error('ArenaLogic checkModuleOpen is empty !');
        return false;
    }
    // return level >= element.getLevel_Function();
    return true;
}
ArenaLogic.prototype.initPlayerArena = function (pPlayerR, cb) {
    var uid = pPlayerR.uid;
    var pid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_PID);
    var nickName = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName);
    var opponentsLevel = 1, opponentsNum = 9;
    var self = this;
    getOpponentPlayersInfoByLevel(this.app, opponentsLevel, opponentsNum, nickName, function (err, res) {
        if (!err) {
            var data = [-1, pid, 1, utils.getCurrTime(), JSON.stringify(res)];
            ArenaDao.updatePlayerArena(self.app, data, function (err, res) {
                if (!err) {
                    data = data.splice(0, 1, res[0][0].OID);
                    utils.invokeCallback(cb, null, data);
                } else {
                    utils.invokeCallback(cb, err);
                }
            });
        } else {
            logger.error('ArenaLogic.initPlayerArena.getOpponentPlayersInfoByLevel err !');
            utils.invokeCallback(cb, err);
        }
    });
}
ArenaLogic.prototype.onModuleOpen = function (pGameMgr, pPlayerR, oldLevel, newLevel) {
    var opened = isModuleOpened(pGameMgr, oldLevel);
    var willOpen = isModuleOpened(pGameMgr, newLevel);
    if (!opened && willOpen) {
        var self = this;
        var uid = pPlayerR.uid;
        this.initPlayerArena(pPlayerR, function (err, res) {
            pPlayerR.setArenaAttrib(res);
            self.sendOpponentPlayersInfoToClient(uid, res[gameEnume.arenaAtt.opponents]);
            self.sendArenaBaseInfoToClient(uid, res);
        });
    }

}
ArenaLogic.prototype.onLoginHandler = function (uid) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (!pGameMgr || !pGameDataMgr) {
        logger.error('ArenaLogic.onLoginHandler pGameDataMgr is empty !');
        return;
    }
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.error('ArenaLogic.onLoginHandler pUser is empty !');
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.error('ArenaLogic.onLoginHandler pPlayerR is empty !');
        return;
    }
    var level = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
    if (isModuleOpened(pGameMgr, level)) {
        var self = this;
        var needSelectFromDB = (pPlayerR.getArenaAttrib().length == 0);
        if (needSelectFromDB) {
            var pid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_PID);
            this.getPlayerArenaDataFromDB(pid, function (err, res) {
                if (!err) {

                    var needInitPlayerArena = !res || res.length == 0;
                    if (needInitPlayerArena) {
                        self.initPlayerArena(pPlayerR, function (err, res) {
                            pPlayerR.setArenaAttrib(res);
                            self.sendOpponentPlayersInfoToClient(uid, res[gameEnume.arenaAtt.opponents]);
                            self.sendArenaBaseInfoToClient(uid, res);
                        });
                    } else {
                        pPlayerR.setArenaAttrib(res);
                        self.sendOpponentPlayersInfoToClient(uid, res[gameEnume.arenaAtt.opponents]);
                        self.sendArenaBaseInfoToClient(uid, res);
                    }
                } else {
                    logger.error('ArenaLogic.onLoginHandler 竞技场读库失败，竞技场内存数据 is empty !');
                }
            });
        } else {
            self.sendOpponentPlayersInfoToClient(uid, pPlayerR.getOneArenaAttrib(gameEnume.arenaAtt.opponents));
            self.sendArenaBaseInfoToClient(uid, pPlayerR.getArenaAttrib());
        }
    }

}

ArenaLogic.prototype.flushOpponents = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var publicLogic = this.app.get('PublicLogic');
    var pUserData = pGameDataMgr.userMgr.getUser(uid);
    if (pUserData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var constantTableData = pGameMgr.TableConstant.Data();
    if (!constantTableData) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }

    var pPlayerR = pUserData.getPlayerRoleData();
    if (pPlayerR == undefined) {
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pid = pPlayerR.getPid();
    // var type = msg['d'][0];
    // if (msg['d'].length != 3) {
    //     next(null, {code: code.SERVER.FA_CLIENT_ARGS_ERR});
    //     return;
    // }
    var cdHours = utils.getConstantValue(constantTableData, gameEnume.constant.arenaOpponentsFlushCD);
    var haveCD = (pPlayerR.getOneArenaAttrib(gameEnume.arenaAtt.flushOpponentsTime) + cdHours * 60 * 60) > utils.getCurrTime();
    if (haveCD) {
        next(null, {code: code.arena.flushOpponentsHaveCD_ERR});
        return;
    }
    var self = this;
    var playerLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
    var playerNick = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName);
    var flushOpponentsNum = pPlayerR.getOneAttrib(gameEnume.arenaAtt.flushOpponentsNum);

    var isNormalMatch = flushOpponentsNum >= playerLevel;
    if (isNormalMatch) {
        getNormalMatchData(self.app, playerLevel, constantTableData, playerNick, function (err, res) {
            if (!err) {
                self.sendOpponentPlayersInfoToClient(uid, res);
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.flushOpponentsNum, ++flushOpponentsNum);
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.flushOpponentsTime, utils.getCurrTime());
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.opponents, res);
                self.flushPlayerArenaDataToDB(pPlayerR.getArenaAttrib());
                self.sendArenaBaseInfoToClient(uid, pPlayerR.getArenaAttrib());
            }
        });
    } else {
        var opponentsLevel = flushOpponentsNum + 1;
        getOpponentPlayersInfoByLevel(self.app, opponentsLevel, 9, playerNick, function (err, res) {
            if (!err) {
                self.sendOpponentPlayersInfoToClient(uid, res);
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.flushOpponentsNum, ++flushOpponentsNum);
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.flushOpponentsTime, utils.getCurrTime());
                pPlayerR.setOneArenaAttrib(gameEnume.arenaAtt.opponents, res);
                self.flushPlayerArenaDataToDB(pPlayerR.getArenaAttrib());
                self.sendArenaBaseInfoToClient(uid, pPlayerR.getArenaAttrib());
            }
        });
    }
    next(null, {code: code.OK, d: []});
}
ArenaLogic.prototype.flushPlayerArenaDataToDB = function (data) {
    var newData = data.slice();
    var opponents = newData[gameEnume.arenaAtt.opponents];
    newData[gameEnume.arenaAtt.opponents] = JSON.stringify(opponents);
    ArenaDao.updatePlayerArena(this.app, newData);
}
ArenaLogic.prototype.getPlayerArenaDataFromDB = function (pid, cb) {
    ArenaDao.getPlayerArenaByPid(this.app, pid, function (err, res) {
        if (!err) {
            if (res && res.length > 0) {
                var opponents = res[gameEnume.arenaAtt.opponents];
                res[gameEnume.arenaAtt.opponents] = JSON.parse(opponents);
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, null);
            }
        } else {
            utils.invokeCallback(cb, err);
        }
    });
}
function getNormalMatchData(app, playerLevel, constantTableData, playerNick, cb) {
    var result = [];
    var normalMatchData = normalMatch(playerLevel, constantTableData);
    async.each(normalMatchData, function (item, callback) {
        getOpponentPlayersInfoByLevel(app, item.level, item.num, playerNick, function (err, res) {
            if (err) {
                callback(err);
            } else {
                result = result.concat(res);
                callback();

            }
        });
    }, function (error) {
        if (error) {
            logger.error('ArenaLogic getNewOpponentsList failed!');
            utils.invokeCallback(cb, error);
        } else {
            utils.invokeCallback(cb, null, result);
        }
    });
}
function normalMatch(playerLevel, constantTableData) {
    var searchData = {};
    var arenaOpponentsMinLevelGap = utils.getConstantValue(constantTableData, gameEnume.constant.arenaOpponentsMinLevelGap, logger);
    var arenaOpponentsMaxLevelGap = utils.getConstantValue(constantTableData, gameEnume.constant.arenaOpponentsMaxLevelGap, logger);
    var arenaAboveOpponentsMinNum = utils.getConstantValue(constantTableData, gameEnume.constant.arenaAboveOpponentsMinNum, logger);
    var arenaAboveOpponentsMaxNum = utils.getConstantValue(constantTableData, gameEnume.constant.arenaAboveOpponentsMaxNum, logger);
    if (!arenaOpponentsMinLevelGap || !arenaOpponentsMaxLevelGap || !arenaAboveOpponentsMinNum || !arenaAboveOpponentsMaxNum) {
        return;
    }
    var maxLevel = playerLevel + arenaOpponentsMaxLevelGap;
    var minLevel = playerLevel + arenaOpponentsMinLevelGap;
    var aboveOpponentsNum = utils.randomNumBetweenWithBorder(arenaAboveOpponentsMinNum, arenaAboveOpponentsMaxNum);
    var otherOpponentsNum = 9 - aboveOpponentsNum;
    for (var i = 0; i < aboveOpponentsNum; i++) {
        var opponentsLevel = utils.randomNumBetweenWithBorder(playerLevel + 1, maxLevel);
        if (!searchData[opponentsLevel]) {
            searchData[opponentsLevel] = [];
        }
        searchData[opponentsLevel].push(1);
    }
    for (var j = 0; j < otherOpponentsNum; j++) {
        var opponentsLevel = utils.randomNumBetweenWithBorder(minLevel, playerLevel);
        if (!searchData[opponentsLevel]) {
            searchData[opponentsLevel] = [];
        }
        searchData[opponentsLevel].push(1);
    }
    return formatSearchData(searchData);
}
function formatSearchData(searchData) {
    var result = [];
    for (var i in searchData) {
        result.push({'level': i, 'num': searchData[i].length});
    }
    return result;
}


function getOpponentPlayersInfoByLevel(app, level, num, playerNick, cb) {
    ArenaCache.getOpponentPlayersInfoByLevel(app, level, num, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, err);
        } else {
            if (res) {
                var gapNum = num - res.length;
                if (gapNum > 0) {//机器人补齐
                    var robots = generateRobots(app, playerNick, level, num);
                    res = res.concat(robots);
                }
            } else {
                res = generateRobots(app, playerNick, level, num);
            }
            utils.invokeCallback(cb, null, res);
        }
    });
}
function generateRobots(app, playerNick, level, num) {
    var pGameMgr = app.get('gameMgr');
    var nameTableData = pGameMgr.TableName;
    var nameTableCount = pGameMgr.TableName.Count();
    var result = [];
    for (var i = 0; i < num; i++) {
        do {
            var firstIndex = utils.randomNumBetweenWithBorder(1, nameTableCount);
            var secondIndex = utils.randomNumBetweenWithBorder(1, nameTableCount);
            var robotName = nameTableData.GetElement(firstIndex).getName_First() + nameTableData.GetElement(secondIndex).getName_Second();
        }
        while (playerNick == robotName);
        var robot = [-1, robotName, 'AnNa2', level, utils.randomNumBetweenWithBorder(0, 5), 0];
        result.push(robot);
    }
    return result;
}
//登陆、变更推送
ArenaLogic.prototype.sendOpponentPlayersInfoToClient = function (uid, dataArr) {
    var route = 'OnUpdateOpponentPlayersInfo';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
ArenaLogic.prototype.sendArenaBaseInfoToClient = function (uid, dataArr) {
    var route = 'OnUpdateArenaBaseInfo';
    var dataArr = dataArr.slice();
    dataArr.splice(gameEnume.arenaAtt.opponents, 1);
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

async.series([function (callback) {
    console.info('1');
    // return;
    // callback();
}, function (callback) {
    console.info('2');
    callback(true);
}, function (callback) {
    console.info('3');
    callback();
}], function (err) {
    console.info('end.');
});
console.info('end.end');
