var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var utils = require('../../util/utils');
var GuankaDb = require('../../mysql/guanKaDb');
var CacheDb = require('../../redis/cacheDb');
var GuankaData = require('../gameData/guankaData');
var FightLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = FightLogic;

// 准备战斗
FightLogic.prototype.newFightStart = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var self = this;
    var uid = session.get('uid');
    var guanKaType = parseInt(msg['d'][0]);    //关卡类型  1常规 2限时 3金币 4卡牌
    var dynaIndex = parseInt(msg['d'][1]);     //关卡ID
    var isContinue = parseInt(msg['d'][2]);    //是否继续战斗 1 继续 0 不继续
    var fightList = msg['d'][3];               //上阵列表
    if(!dynaIndex || !guanKaType){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

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
    var userMedalNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL);
    switch(guanKaType){
        case 1://常规模式
            //检测体力是否够

            //检测上阵列表
            var returnCode = self.checkFightListFunc(pPlayerR, fightList);
            if(returnCode != code.OK){
                next(null, {code: returnCode});
                return;
            }
            //常规关卡数据检测
            var pGuanKaTable = pGameMgr.TableRound.GetElement(dynaIndex);
            if (!pGuanKaTable) {
                logger.info('该关卡%d不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                return;
            }
            var guanKaType = pGuanKaTable.getType_RoundSmall();
            //var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            var userCurGid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN);
            if(userCurGid < dynaIndex){//判断勋数
                logger.info('非法挑战', dynaIndex);
                next(null, {code: code.FIGHT.FA_QZ_GUANKA_FAIL});
                return;
            }
            if(guanKaType == 1){//大关卡
                //检测关卡开启勋章数
                var medalNum = pGuanKaTable.getScoreLimit_Round();
                if(userMedalNum < medalNum){
                    logger.info('勋章数不足', userMedalNum);
                    next(null, {code: code.FIGHT.FA_MEDAL_NUM_NOT_ENOUGH});
                    return;
                }
            }
            // 获取玩家数据察看是否可以战斗
            var bigGuanId = pGuanKaTable.getID_RoundBig();
            //常规关卡城池数据检测
            var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(bigGuanId);
            if (!pCityGuanKaTable) {
                logger.info('配表中该大关卡ID%d不存在', bigGuanId);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }

            var pid = pPlayerR.getPid();
            var pGuanKa = pPlayerR.getGuanka(bigGuanId);
            if (!pGuanKa) {
                // 发送消息到客户端 通知客户端开始战斗  可以战斗创建数据加入到数据结构 以及存盘
                pGuanKa = new GuankaData();
                pGuanKa.setAllAttrib([-1, pid, bigGuanId, 0, 0, '',0,0,0,0,0,0,0]);

                // 发送消息到客户端  存盘以及 发送消息到客户端
                self.updataGuanka_DB(self, pGuanKa, function (err, res) {
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    pGuanKa.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_ID, res[0][0].OID);
                    pPlayerR.addGuanka(pGuanKa);
                    self.sendGuankaTo_C(uid, [pGuanKa.getAttrib()]);
                });
                next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});//, d: [fightList, guanKaIndex]
                return;
            } else {
                next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});//, d: [fightList, guanKaIndex]
                return;
            }
        default :
            logger.info('参数错误, 关卡模式非法');
            next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
            return;
    }
}
// 准备战斗
FightLogic.prototype.fightStart = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var self = this;
    var uid = session.get('uid');
    var guanKaType = parseInt(msg['d'][0]);    //关卡类型  1常规 2限时 3金币 4卡牌
    var dynaIndex = parseInt(msg['d'][1]);     //关卡ID
    var isContinue = parseInt(msg['d'][2]);    //是否继续战斗 1 继续 0 不继续
    var fightList = msg['d'][3];               //上阵列表
    if(!dynaIndex || !guanKaType){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }

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
    var userMedalNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL);

    switch(guanKaType){
        case 1://常规模式
            //检测上阵列表
            var returnCode = self.checkFightListFunc(pPlayerR, fightList);
            if(returnCode != code.OK){
                next(null, {code: returnCode});
                return;
            }
            //常规关卡数据检测
            var pGuanKaTable = pGameMgr.TableRound_Small.GetElement(dynaIndex);
            if (!pGuanKaTable) {
                logger.info('该关卡%d不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                return;
            }
            // 获取玩家数据察看是否可以战斗
            var cityId = pGuanKaTable.getID_RoundBig();
            //常规关卡城池数据检测
            var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
            if (!pCityGuanKaTable) {
                logger.info('配表中该城池%d不存在', cityId);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }
            var medalNum = pCityGuanKaTable.getScoreLimit_Round();
            var userLevelLimit = pCityGuanKaTable.getLevelLimit_Round();
            var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            var userCurGid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN);
            if(userLevel < userLevelLimit){
                logger.info('等级不够，不足以挑战', userLevel);
                next(null, {code: code.USER.FA_USER_LEVEL_NOT_ENOUGH});
                return;
            }
            if(userCurGid < dynaIndex){//判断勋数
                if(userMedalNum < medalNum){
                    logger.info('勋章数不足', userMedalNum);
                    next(null, {code: code.FIGHT.FA_MEDAL_NUM_NOT_ENOUGH});
                    return;
                }
            }
            var pid = pPlayerR.getPid();
            var pGuanKa = pPlayerR.getGuanka(cityId);
            if (!pGuanKa) {
                // 发送消息到客户端 通知客户端开始战斗  可以战斗创建数据加入到数据结构 以及存盘
                pGuanKa = new GuankaData();
                pGuanKa.setAllAttrib([-1, pid, cityId, 0, 0, '',0,0,0,0,0,0,0]);

                // 发送消息到客户端  存盘以及 发送消息到客户端
                self.updataGuanka_DB(self, pGuanKa, function (err, res) {
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    pGuanKa.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_ID, res[0][0].OID);
                    pPlayerR.addGuanka(pGuanKa);
                    self.sendGuankaTo_C(uid, [pGuanKa.getAttrib()]);
                });
                next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});//, d: [fightList, guanKaIndex]
                return;
            } else {
                next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});//, d: [fightList, guanKaIndex]
                return;
            }

        case 2://限时模式
            //检测上阵列表
            var returnCode = self.checkFightListFunc(pPlayerR, fightList);
            if(returnCode != code.OK){
                next(null, {code: returnCode});
                return;
            }
            //限时关卡数据检测
            var pTimeGuanKaTable = pGameMgr.TableRound_Time.GetElement(dynaIndex);
            if (!pTimeGuanKaTable) {
                logger.info('配表中该限时关卡%d不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }
            var cityId = pTimeGuanKaTable.getID_RoundBig();
            //限时关卡城池数据检测
            var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
            if (!pCityGuanKaTable) {
                logger.info('配表中该城池%d不存在', cityId);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }
            //验证该城池最后一关有没有通过
            var lastGuankaId = pCityGuanKaTable.getID_RoundSmall_End();
            var userLevelLimit = pCityGuanKaTable.getLevelLimit_Round();
            var firstGuanka = pCityGuanKaTable.getID_RoundTime_First();

            var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            if(userLevel < userLevelLimit){
                logger.info('等级不够，不足以挑战', userLevel);
                next(null, {code: code.USER.FA_USER_LEVEL_NOT_ENOUGH});
                return;
            }
            var pGuanKa = pPlayerR.getGuanka(cityId);
            if(!pGuanKa){
                logger.info('关卡数据不存在', pGuanKa);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }

            if(!isContinue){
                if(firstGuanka != dynaIndex){
                    logger.info('数据错误，不是限时模式第一关', dynaIndex);
                    next(null, {code: code.FIGHT.FA_FIGHT_INVALID_ARGS});
                    return;
                }
                pGuanKa.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_SerialTimes, 0);
                self.updataGuanka_DB(self, pGuanKa, function (err, res) {});
            }

            var userLastId = pGuanKa.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LastGuan);
            if(userLastId != lastGuankaId){
                logger.info('该城池常规模式没通关，不能挑战限时模式', lastGuankaId);
                next(null, {code: code.FIGHT.FA_NOT_PASS_GENERAL_GUANKA});
                return;
            }
            next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});
            return;
        case 3://金币图腾
            //检测上阵列表
            var returnCode = self.checkFightListFunc(pPlayerR, fightList);
            if(returnCode != code.OK){
                next(null, {code: returnCode});
                return;
            }
            //特殊关卡 金币检测
            var pGoldGuanKaTable = pGameMgr.TableRound_Gold.GetElement(dynaIndex);
            if (!pGoldGuanKaTable) {
                logger.info('配表中该数据不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_TBL_GOLD_GUANKA_NO_DATA});
                return;
            }
            var limitUserLevel = pGoldGuanKaTable.getLevel_Player();
            var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            var moneyTicketNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET);
            if(limitUserLevel > userLevel){
                logger.info('等级不够，不足以挑战', userLevel);
                next(null, {code: code.USER.FA_USER_LEVEL_NOT_ENOUGH});
                return;
            }
            if(moneyTicketNum < 1){
                logger.info('金币券不够，不足以挑战', moneyTicketNum);
                next(null, {code: code.USER.FA_MONEYTICKET_NOT_ENOUGH});
                return;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET, -1);
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                //发送客户端
                pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
            })
            next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList]});
            return;
        case 4://随机关卡
            //特殊关卡
            var pRandCardGuanKaTable = pGameMgr.TableRound_Card.GetElement(dynaIndex);
            if (!pRandCardGuanKaTable) {
                logger.info('配表中该数据不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_TBL_RANDCARD_GUANKA_NO_DATA});
                return;
            }
            var groupArr = pRandCardGuanKaTable.getID_MyselfGroup();
            if(groupArr.length < 0){
                logger.info('配表中该数据不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_TBL_RANDCARD_GUANKA_NO_DATA});
                return;
            }
            var groupId = groupArr[utils.getRandNum(groupArr.length-1)];
            var limitUserLevel = pRandCardGuanKaTable.getLevel_Player();
            var userLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
            var cardTicketNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET);
            if(limitUserLevel > userLevel){
                logger.info('等级不够，不足以挑战', userLevel);
                next(null, {code: code.USER.FA_USER_LEVEL_NOT_ENOUGH});
                return;
            }
            if(cardTicketNum < 1){
                logger.info('随机卡牌券不够，不足以挑战', cardTicketNum);
                next(null, {code: code.USER.FA_RANDTICKET_NOT_ENOUGH});
                return;
            }
            pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET, -1);
            pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                //发送客户端
                pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
            })
            next(null, {code: code.OK, d:[guanKaType,dynaIndex,isContinue,fightList, groupId]});
            return;
        default :
            logger.info('参数错误, 关卡模式非法');
            next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
            return;
    }
}

// 开始游戏
FightLogic.prototype.bettleIsOk = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    //var pUserLogic = this.app.get('UserLogic');
    var self = this;
    var uid = session.get('uid');
    var cardGroup = parseInt(msg['d'][0]);    //卡组ID
    var guanType = parseInt(msg['d'][1]);     //关卡模式
    var isContinue = parseInt(msg['d'][2]);   //是否继续 1 继续 0 不继续
    if(!cardGroup || !guanType){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }
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
    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGROUP, cardGroup);
    var curTime = utils.getCurrTime();
    //限时模式
    if(guanType == 2){
        var needTime;
        if(isContinue){
            var endTime = pUser.getBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_EndTime)
            var startTime = pUser.getBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_StartTime)
            needTime = pUser.getBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_LastTime)
            var defTime = endTime - startTime;
            needTime = needTime - defTime;
            console.log('lastTime', needTime);
            pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_LastTime, needTime)
            pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_StartTime, curTime);
            if(needTime < 0){
                needTime = 0;
                next(null, {code: code.OK, d:[needTime]});
                return;
            }
        } else {
            var pConstantTable = pGameMgr.TableConstant.GetElement(3);
            needTime = parseInt(pConstantTable.getValue_Constant());
            pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_LastTime, needTime)
            pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_StartTime, curTime);
        }
        //剩余时间计时器
        pPlayerR.limitTimeFlag = setTimeout(function () {
            //推送
            self.sendEndLimitTimeTo_C(uid);
        }, needTime*1000);
        next(null, {code: code.OK, d:[needTime]});
        return;
    } else {
        pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_StartTime, curTime);
        next(null, {code: code.OK});
        return;
    }
}

// 战斗结束
FightLogic.prototype.fightEnd = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code:code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pUserLogic = this.app.get('UserLogic');
    var pCardLogic = this.app.get('CardLogic');
    var pBoxLogic = this.app.get('BoxLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var pPublicLogic = this.app.get('PublicLogic');
    var self = this;
    var uid = session.get('uid');
    var guanKaType = parseInt(msg['d'][0]);    //关卡类型  1常规 2限时 3金币 4卡牌
    var dynaIndex = parseInt(msg['d'][1]);     //关卡ID  1常规(关卡ID) 2限时(城池ID) 3金币(关卡ID) 4卡牌(关卡ID)
    var bettleRes = parseInt(msg['d'][2]);     //战斗结果 常规、金币、卡牌 1胜利 0失败 -1强制退出   限时 波数
    var params4 = msg['d'][3];                 //参数4 金币关（敌方剩余生命） 卡牌关（己方卡组）
    var params5 = msg['d'][4];                 //参数5 金币关（敌方总生命）
    if(!dynaIndex || !guanKaType){
        logger.info('参数错误');
        next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
        return;
    }
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
    var endTime = utils.getCurrTime();
    pUser.setBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_EndTime, endTime);
    var startBettleTime = pUser.getBettle(gameEnume.BettleEnumAtt.BettleEnumAtt_StartTime);
    var pid = pPlayerR.getPid();
    switch (guanKaType){
        case 1://常规模式
            //常规关卡数据检测
            var pGuanKaTable = pGameMgr.TableRound_Small.GetElement(dynaIndex);
            if (!pGuanKaTable) {
                logger.info('该关卡%d不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                return;
            }
            // 获取玩家数据察看是否可以战斗
            var cityId = pGuanKaTable.getID_RoundBig();
            var isSave = pGuanKaTable.getIsSave();
            //常规关卡城池数据检测
            var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
            if (!pCityGuanKaTable) {
                logger.info('配表中该城池%d不存在', cityId);
                next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                return;
            }
            var cityName = pCityGuanKaTable.getName_RoundBig();
            var reduceMedal = pCityGuanKaTable.getScore_Lose();
            var addMedal = pCityGuanKaTable.getScore_Win();
            var lastGuankaId = parseInt(pCityGuanKaTable.getID_RoundSmall_End());

            var limitMedal = pCityGuanKaTable.getScoreMax_Day_Round();
            //var startBettleTime = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_BettleTime);
            var pBase = pPlayerR.getBase();
            var pGuanka = pPlayerR.getGuanka(cityId);
            if(!pGuanka){
                logger.info('没有该关卡数据', cityId);
                next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                return;
            }
            if(!pBase){
                logger.info('没有主基地数据');
                next(null, {code: code.BASE.FA_NOT_EXIST});
                return;
            }

            var baseLevel = pBase.getOneAttrib(gameEnume.baseAttrib.BASE_ATTRIB_LEVEL);
            var historyBestScore = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_SCORE);
            if(bettleRes < 1){//战斗失败 扣除勋章数
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL, -reduceMedal);
                pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                })
                pGuanka.changeAttribCount(gameEnume.guankaAttrib.GUANQIA_ATTRIB_DailyMedal, -reduceMedal);
                self.updataGuanka_DB(self, pGuanka, function(err, res){
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    //客户端
                    self.sendGuankaTo_C(uid, [pGuanka.getAttrib()]);
                })
                next(null, {code: code.OK, d:[bettleRes, guanKaType, reduceMedal]});
                return;
            } else {//战斗胜利
                var nickName = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName);

                var curGuanka = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN);
                var userSaveId = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_SaveGuan);
                var curSumMedalNum = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL);
                //计算积分
                var lastTime = self.calcuLastTimeFunc(endTime, startBettleTime);
                var score = self.calcuScoreFunc(lastTime, baseLevel, params4, params5);
                //是否超过历史分
                if(score > historyBestScore){
                    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_SCORE, score);
                }

                //完成常规模式胜利 成就
                var oldNum = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_normalNum);
                var newSumVicNum = oldNum + 1;
                pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_normalNum, newSumVicNum);

                var isOpenNextCity = 0;
                var flagMedal = 0;
                if(dynaIndex == lastGuankaId){//最后一关
                    curSumMedalNum = curSumMedalNum + addMedal;
                    //掉落随机折扣卡牌
                    var pConstantTable = pGameMgr.TableConstant.GetElement(9);
                    var failTime = parseInt(pConstantTable.getValue_Constant());
                    var cardDropTime = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardDropTime);
                    var newSumTime = failTime + cardDropTime;
                    //var curTime = utils.getCurrTime();
                    if(endTime > newSumTime){
                        var dropCardId = pCardLogic.randOneCardByType();
                        pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_rewardCard, dropCardId);
                        pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_cardDropTime, endTime);
                    }

                    //更新上一城的下一城是否通关
                    var pLastGuanka = pPlayerR.getGuanka(cityId-1);//上一城
                    if(pLastGuanka){
                        pLastGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_NextLastGuan, 1);
                        //更新上一城关卡数据库
                        self.updataGuanka_DB(self, pLastGuanka, function(){});
                    }
                    //记录最后一关
                    pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LastGuan, dynaIndex);

                    if(dynaIndex >= curGuanka){
                        //是否开启下一大关
                        var nextCity = cityId + 1;
                        var pNextCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(nextCity);
                        if(pNextCityGuanKaTable){
                            var nextMedal = pNextCityGuanKaTable.getScoreLimit_Round();
                            if(curSumMedalNum >= nextMedal){//当前关卡是最后一关卡并勋章数满足
                                isOpenNextCity = 1;
                                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_NextLastGuan, 1);
                                pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN, pNextCityGuanKaTable.getID_RoundSmall_First());
                                var tempId = 9100042;
                                //通知
                                pPublicLogic.SendNotice(tempId, [nickName,cityName]);
                                //完成解锁下一大关卡成就
                                pAchieveLogic.achieveTrigger(pPlayerR, 1, nextCity);
                            }
                        } else {
                            logger.info('再也没有了，你已通关', nextCity);
                            isOpenNextCity = -1;
                        }
                        flagMedal = addMedal;
                        pGuanka.changeAttribCount(gameEnume.guankaAttrib.GUANQIA_ATTRIB_DailyMedal, addMedal);
                        pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MEDAL, curSumMedalNum);
                    }
                } else {
                    if(dynaIndex >= curGuanka){
                        pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_CURGUAN, ++dynaIndex);
                    }
                }
                //更新note表
                if(isOpenNextCity != 1){
                    pAchieveLogic.updatePlayerNote(self.app, pPlayerR.getNoteAttrib(), function(err, res){
                        pAchieveLogic.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
                    });
                }

                //存档
                if(!!isSave && dynaIndex > userSaveId){
                    pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_SaveGuan, dynaIndex);
                }

                var curUserMedal = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_DailyMedal);
                //触发敌方难度
                if(curUserMedal > limitMedal){
                    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_IsOverM, 1);
                } else {
                    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_IsOverM, 0);
                }
                //新手引导
                var curNewPlayerId = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.NOTE_ATTRIB_newPlayerGuide);
                if(curNewPlayerId <= 107){
                    var boxId = 9999999;
                } else {
                    //根据胜利次数掉宝箱
                    var boxId = pBoxLogic.getBoxIdByVicNumFunc(pPlayerR, newSumVicNum, cityId);
                    if(!boxId){
                        logger.info('数据错误，没有找到宝箱ID', boxId);
                    }
                }

                //宝箱加入数据库
                var boxFlag = pBoxLogic.addBox(pPlayerR, boxId,1);
                if(!boxFlag){
                    boxId = -1;
                }
                var isPassNextCity = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_NextLastGuan);

                //var enScore = utils.getEnScore(score);
                var ukeys = pid+'#'+uid;
                //排行 更改分数
                CacheDb.addScore(self.app, cityId, CacheDb.prefix()['genSumRank'], score, ukeys, isPassNextCity);
                CacheDb.updateUserNickName(self.app, pid, nickName);
                //更新关卡最高排名
                CacheDb.getUserRank(self.app, CacheDb.prefix()['genSumRank'] + cityId +'-'+ isPassNextCity, ukeys, function(err, res){
                    if(typeof (res) === 'number'){
                        var curRnak = res + 1;
                        if(isOpenNextCity == 0){//首次
                            var historyGenF = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_GenF);
                            if(historyGenF == 0 || curRnak < historyGenF){
                                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_GenF, curRnak);
                            }
                        }else if(isOpenNextCity == 1){//极限
                            var historyGenL = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_GenL);
                            if(historyGenL == 0 || curRnak < historyGenL){
                                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_GenL, curRnak);
                            }
                        }
                    }
                    //更新关卡数据库
                    self.updataGuanka_DB(self, pGuanka, function(){});
                    self.sendGuankaTo_C(uid, [pGuanka.getAttrib()]);
                });
                //更新总排行榜最高排名
                CacheDb.getUserRank(self.app, CacheDb.prefix()['sumRank'], ukeys, function(err, res){
                    if(typeof (res) === 'number'){
                        var curRnak = res + 1;
                        var historyRank = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_RANK);
                        if(historyRank == 0 || curRnak < historyRank){
                            pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_RANK, curRnak);
                        }
                    }
                    //更新人物数据库
                    pUserLogic.updatePlayerRole_DB(self, pPlayerR, function () {
                    })
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                });
                next(null, {code: code.OK, d:[bettleRes, guanKaType, boxId, score, flagMedal, isOpenNextCity]});
                return;
            }
        case 2://限时模式
            if(pPlayerR.limitTimeFlag){
                console.log('战斗结束开始清理',pPlayerR.limitTimeFlag);
                clearTimeout(pPlayerR.limitTimeFlag);
                pPlayerR.limitTimeFlag = 0;
            }

            if(bettleRes < 1){//战斗失败
                next(null, {code: code.OK, d:[bettleRes, guanKaType]});
                return;
            } else {
                //限时关卡数据检测
                var pTimeGuanKaTable = pGameMgr.TableRound_Time.GetElement(dynaIndex);
                if (!pTimeGuanKaTable) {
                    logger.info('配表中该限时关卡%d不存在', dynaIndex);
                    next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                    return;
                }
                var cityId = pTimeGuanKaTable.getID_RoundBig();
                //限时关卡城池数据检测
                var pCityGuanKaTable = pGameMgr.TableRound_Big.GetElement(cityId);
                if (!pCityGuanKaTable) {
                    logger.info('配表中该城池%d不存在', cityId);
                    next(null, {code: code.FIGHT.FA_GUANKA_NO_DATA});
                    return;
                }
                var rewardArr = pCityGuanKaTable.getAward_RoundTime();
                //var startBettleTime = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_BettleTime);
                var pGuanka = pPlayerR.getGuanka(cityId);
                var pBase = pPlayerR.getBase();

                if(!pGuanka){
                    logger.info('没有该关卡数据', cityId);
                    next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                    return;
                }
                if(!pBase){
                    logger.info('没有主基地数据');
                    next(null, {code: code.BASE.FA_NOT_EXIST});
                    return;
                }

                var baseLevel = pBase.getOneAttrib(gameEnume.baseAttrib.BASE_ATTRIB_LEVEL);
                var historyBestScore = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_SCORE);
                //计算积分
                var lastTime = self.calcuLastTimeFunc(endTime, startBettleTime);
                var score = self.calcuScoreFunc(lastTime, baseLevel, params4, params5);
                //是否超过历史分
                if(score > historyBestScore){
                    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_SCORE, score);
                }
                var getRewardStr = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_Round);
                var userSerialTimes = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_SerialTimes);
                var sumSerialTime = userSerialTimes + 1;
                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_SerialTimes, sumSerialTime);
                var boxId = self.limitTimeRewardFunc(rewardArr, sumSerialTime);
                next(null, {code: code.OK, d:[bettleRes, guanKaType, boxId, score]});
                if(boxId){//有宝箱奖励
                    if(getRewardStr.length > 0){
                        var newArr = getRewardStr.split(',');
                        if(!utils.contains(newArr, sumSerialTime.toString())){//不在数组里则给奖励
                            newArr.push(sumSerialTime);
                            getRewardStr = newArr.join(',');
                            pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_Round, getRewardStr);
                            pBoxLogic.getBoxReward(pPlayerR, boxId);
                        }
                    } else {
                        var newStr = sumSerialTime;
                        pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_Round, newStr);
                        pBoxLogic.getBoxReward(pPlayerR, boxId);
                    }
                } else{
                    boxId = -1;
                }

                //限时模式胜利次数成就
                pAchieveLogic.achieveTrigger(pPlayerR, gameEnume.achieveTypeEnume.addLimit, 1);

                var isPassNextCity = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_NextLastGuan);
                var nickName = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName);
                //var enScore = utils.getEnScore(score);
                var ukeys = pid+'#'+uid;
                //排行 更改分数
                CacheDb.addScore(self.app, cityId, CacheDb.prefix()['limSumRank'], score, ukeys, isPassNextCity);
                CacheDb.updateUserNickName(self.app, pid, nickName);
                //更新关卡最高排名
                CacheDb.getUserRank(self.app, CacheDb.prefix()['limSumRank'] + cityId +'-'+ isPassNextCity, ukeys, function(err, res){
                    if(typeof (res) === 'number'){
                        var curRnak = res + 1;
                        if(isOpenNextCity == 0){//首次
                            var historyLimF = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LimF);
                            if(historyLimF == 0 || curRnak < historyLimF){
                                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LimF, curRnak);
                            }
                        } else if(isOpenNextCity == 1){//极限
                            var historyLimL = pGuanka.getOneAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LimL);
                            if(historyLimL == 0 || curRnak < historyLimL){
                                pGuanka.setAttrib(gameEnume.guankaAttrib.GUANQIA_ATTRIB_LimL, curRnak);
                            }
                        }
                    }
                    //更新关卡数据库
                    self.updataGuanka_DB(self, pGuanka, function(){});
                    self.sendGuankaTo_C(uid, [pGuanka.getAttrib()]);
                });
                //更新总排行榜最高排名
                CacheDb.getUserRank(self.app, CacheDb.prefix()['sumRank'], ukeys, function(err, res){
                    if(typeof (res) === 'number'){
                        var curRnak = res + 1;
                        var historyRank = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_RANK);
                        if(historyRank == 0 || curRnak < historyRank){
                            pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_HIGHT_RANK, curRnak);
                        }
                    }
                    //更新人物数据库
                    pUserLogic.updatePlayerRole_DB(self, pPlayerR, function () {
                    })
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                });
                return;
            }

        case 3://金币图腾
            //金币关卡数据检测
            var pGoldGuanKaTable = pGameMgr.TableRound_Gold.GetElement(dynaIndex);
            if (!pGoldGuanKaTable) {
                logger.info('配表中该%d不存在', dynaIndex);
                next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                return;
            }
            var lastHp = parseInt(params4);
            var sumHp = parseInt(params5);
            if(lastHp > sumHp){
                logger.info('血量数据非法');
                next(null, {code: code.FIGHT.FA_FIGHT_INVALID_ARGS});
                return;
            }
            var numGold = pGoldGuanKaTable.getNum_Gold();
            var money = self.calcuGetMoneyFunc(params4, params5, numGold);
            if(!!money){
                pPlayerR.changeAttribCount(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY, money);
                pUserLogic.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    //发送客户端
                    pUserLogic.sendPlayerRoleTo_C(uid, pPlayerR);
                })
            }
            next(null, {code: code.OK,d:[bettleRes, guanKaType, money]});
            return;
        case 4://随机关卡
            if(bettleRes < 1){//战斗失败
                next(null, {code: code.OK, d:[bettleRes, guanKaType]});
                return;
            } else {
                //随机关卡数据检测
                var pCardRewardData = pGameMgr.TableRound_Card_Award.Data();
                if (!pCardRewardData) {
                    logger.info('配表中该%d不存在');
                    next(null, {code: code.FIGHT.FA_GUANKA_NOT_EXIST});
                    return;
                }
                var guanId,selfGroup,item, rewardArr;
                for(item in pCardRewardData){
                    guanId = pCardRewardData[item].getID_RoundCrad();
                    selfGroup = pCardRewardData[item].getID_MyselfGroup();
                    if(dynaIndex == guanId && params4 == selfGroup){
                        rewardArr = pCardRewardData[item].getAward_RoundCard();
                    }
                }
                var cardId, cardNum, cardLevel = 1;
                for(var i in rewardArr){
                    cardId = rewardArr[i].getValue1();
                    cardNum = rewardArr[i].getValue2();
                    pCardLogic.addCardFunc(pPlayerR, cardId, cardNum, cardLevel);
                }
                next(null, {code: code.OK, d:[bettleRes, guanKaType, params4]});
                return;
            }
        default :
            logger.info('参数错误, 关卡模式非法');
            next(null, {code:code.SERVER.FA_REQ_PARAMS_ERROR});
            return;
    }
}

// 检测上阵列表
FightLogic.prototype.checkFightListFunc = function (pPlayerR, fightList) {
    var fightLength = fightList.length;
    if(fightLength != 8){
        logger.info('上阵卡牌数量不合法', fightLength);
        return code.FIGHT.FA_BATTLE_LIST_INVALID;
    }
    for (var i in fightList) {
        var fightArr = utils.isArray(fightList[i]);
        //console.log('fightArr', fightArr, fightList[i]);
        if (!fightArr || fightList[i].length < 1) {
            logger.info('用户 %d ，上阵数据有误', uid);
            return code.FIGHT.FA_BATTLE_LIST_INVALID;
        }
        var cardId = fightList[i][0];
        var cardLevel = fightList[i][1];
        var cardNum = fightList[i][2];
        var pCard = pPlayerR.getCard(cardId);
        if (!pCard) {
            logger.info('服务器找不到该数据 %d', cardId);
            return code.FIGHT.FA_BATTLE_LIST_INVALID;
        }
        var num = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_NUM);
        var level = pCard.getOneAttrib(gameEnume.cardAttrib.CARD_ATTRIB_LEVEL);

        if (cardLevel != level || cardNum != num) {
            logger.info('上阵数据与服务器不匹配', cardLevel, cardNum);
            return code.FIGHT.FA_BATTLE_LIST_INVALID;
        }
    }
    return code.OK;
}

// 计算积分 公式：（（己方消耗卡牌费点+卡牌等级）之和+（敌方消耗卡牌费点+卡牌等级）之和+战斗剩余时间（秒））*（敌方基地等级/己方基地等级）
FightLogic.prototype.calcuScoreFunc = function (lastTime, selfBaseLevel, selfArr, enmyArr) {
    var selfPoint = parseInt(selfArr[0]);
    var selfSumLevel = parseInt(selfArr[1]);

    var enmyPoint = parseInt(enmyArr[0]);
    var enmySumLevel = parseInt(enmyArr[1]);
    var enmyBaseLevel = parseInt(enmyArr[2]);
    var score = parseInt(((selfPoint + selfSumLevel) + (enmyPoint + enmySumLevel) + lastTime) * (enmyBaseLevel / selfBaseLevel).toFixed(2));
    return score;
}

// 是否限时波数奖励 rewardArr [[9010909,3]]
FightLogic.prototype.limitTimeRewardFunc = function (rewardArr, bettleRes) {
    for(var i in rewardArr){
        if(rewardArr[i].getValue2() == bettleRes){
            return rewardArr[i].getValue1();
        }
    }
    return false;
}
//金币关卡获得金币数量 奖励金币数量=(1-敌方基地剩余生命值/敌方生命值总量)x100
FightLogic.prototype.calcuGetMoneyFunc = function (enmyLastHp, enmySumHp, ii) {

    return parseInt((1-(enmyLastHp/enmySumHp)) * ii);
}

FightLogic.prototype.calcuLastTimeFunc = function (endTime, startTime) {
    //var curTime = utils.getCurrTime();
    var defTime = endTime - startTime;
    var lastTime = 5*60 - defTime;
    if(lastTime < 0){
        lastTime = 0;
    }
    return lastTime;
}

// 更新关卡
FightLogic.prototype.updataGuanka_DB = function (self, pGuankaData, cb) {
    var data = pGuankaData.getAttrib();
    GuankaDb.updatePlayerGuanka(self.app, data, cb);
}

// 发送数据到客户端
FightLogic.prototype.sendGuankaTo_C = function (uid, data) {
    var route = 'OnUpdataGuanka';
    var nData = {d: data};
    this.msgServer.pushMessageToPlayer(uid, route, nData);
}

// 发送数据到客户端
FightLogic.prototype.sendEndLimitTimeTo_C = function (uid) {
    var route = 'OnEndLimitTime';
    var nData = {d: ""};
    this.msgServer.pushMessageToPlayer(uid, route, nData);
}