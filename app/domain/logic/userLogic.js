var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var async = require('async');
var code = require('../gameData/code');
var utils = require('../../util/utils');
var userDb = require('../../mysql/userDb');
var playerRoleData = require('../gameData/playerRoleData');
var userData = require('../gameData/userData');
var CardData = require('../gameData/cardData');
var CardGroupData = require('../gameData/cardGroupData');
var BaseData = require('../gameData/baseData');
var MailsData = require('../gameData/mailsData');
var ShopData = require('../gameData/shopData');
var GuankaData = require('../gameData/guankaData');
var BoxData = require('../gameData/boxData');
var AchieveData = require('../gameData/achieveData');
// 玩家加载子集
var dbUserIndex = 0;                // 玩家信息
var dbPlayerRoleIndex = 1;          // 玩家角色信息
var dbBaseDataIndex = 2;            // 玩家基地信息
var dbCardDataIndex = 3;            // 玩家卡牌信息
var dbCardGroupDataIndex = 4;       // 玩家卡组信息
var dbMailDataIndex = 5;            // 玩家消息信息
var dbShopDataIndex = 6;            // 玩家商城信息
var dbGuankaDataIndex = 7;          // 玩家关卡信息
var dbBoxDataIndex = 8;             // 玩家宝箱信息
var dbGotAchieveDataIndex = 9;      // 玩家已领取成就
var dbNoteDataIndex = 10;           // 玩家成就记录信息
var dbHonorDataIndex = 11;          // 玩家荣誉记录信息
var UserLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = UserLogic;
UserLogic.prototype.userStartGame = function (uid, conserverid, zid, next) {
    var self = this;
    var pArenaLogic = this.app.get('ArenaLogic');
    // 根据用户情况来确定是加载还是创建用户
    userDb.checkPlayerRole(this.app, uid, function (err, res) {
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }

        var bHave = res[0][0].eCode;
        if (!bHave) {
            self.createPlayerRole(uid, conserverid, zid, next, function () {
                pArenaLogic.onLoginHandler(uid);
            });
        } else {
            var pid = res[0][0].oPid;
            self.loadPlayerRole(uid, pid, conserverid, next, function () {
                pArenaLogic.onLoginHandler(uid);
            });
        }
        next(null, {code: code.OK});
    });
}

// 创建一个用户
UserLogic.prototype.createPlayerRole = function (uid, conserverid, zid, next, cb) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var pCardLogic = this.app.get('CardLogic');
    var pBaseLogic = this.app.get('BaseLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var pPublicLogic = this.app.get('PublicLogic');
    var self = this;

    // 添加用户到 channel
    self.msgServer.addtoChannel(uid, conserverid);

    var pPlayerR = new playerRoleData(uid);

    //var tempCount = pGameMgr.TableInitUser.Count();
    /*if(tempCount < 0){

     }*/
    var tempData = pGameMgr.TableInitUser.Data();
    var item, goodsType;
    var goodsObj = {};
    for (item in tempData) {
        goodsType = tempData[item].getResources_type();
        if (!goodsObj[goodsType]) {
            goodsObj[goodsType] = [];
        }
        goodsObj[goodsType].push(tempData[item]);
    }
    var tempRoleData = goodsObj[gameEnume.InitUser_TableType.TABLE_Type_PLAYER];
    var tempCardData = goodsObj[gameEnume.InitUser_TableType.TABLE_Type_Card];
    var tempCardNum = tempCardData.length;
    var i, pItem;
    for (i in tempRoleData) {
        pItem = tempRoleData[i];
        pPlayerR.setAttrib(pItem.getValue_1(), pItem.getValue_2());
    }
    var logArr = [];//日志
    var money = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY) || 0;
    var diamond = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND) || 0;
    var moneyTicket = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_MONEY_TICKET) || 0;
    var randTicket = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_RAND_TICKET) || 0;
    var nickName = "";
    //var kGroupId = 1;//默认卡组ID
    var constantData = pGameMgr.TableConstant.Data();
    var constantMaxPowerData = constantData[gameEnume.constant.maxPower];
    var maxPower = constantMaxPowerData.getValue_Constant();
    pPlayerR.setAllAttrib([0, uid, 1, 0, money, diamond, moneyTicket, randTicket, 0, 0, 0, nickName, 0, 101, 1, maxPower, 0, 'AnNa2', 0, 0, 0, 0, 0, 0]);
    var cardArr = [];
    var initCardNum = 0;
    async.waterfall([
        function (callback) {
            // 创建人物角色
            self.updatePlayerRole_DB(self, pPlayerR, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                var eCode = res[0][0].ECode;
                var pid = res[0][0].OPID;
                var oNickName = res[0][0].ONickName;

                pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_PID, pid);
                pPlayerR.setPid(pid);

                pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName, oNickName);

                var pUserData = new userData(uid);

                pUserData.setConServerID(conserverid);
                pUserData.addPlayerRoleData(pPlayerR);

                pGameDataMgr.userMgr.addUser(pUserData);

                self.sendPlayerRoleTo_C(uid, pPlayerR);
                callback(null, pid, pUserData);
            })

        },
        function (arg1, pUserData, callback) {
            //console.log('step2', arg1);
            userDb.getUserById(self.app, uid, function (err, res) {
                var userLength = res && res.length;
                if (userLength > 0) {
                    pUserData.setAllAttrib(res);
                }
                callback(null, arg1);
            })
        },
        function (arg1, callback) {
            //console.log('step3', arg1);
            //基地
            var tempBaseData = goodsObj[gameEnume.InitUser_TableType.TABLE_Type_Base];
            var pBaseData = tempBaseData[0];

            var baseId = pBaseData.getValue_1();
            var baseLevel = pBaseData.getValue_2();
            var pBase = new BaseData();
            pBase.setAllAttrib([-1, arg1, baseId, baseLevel, 0]);
            pBaseLogic.updataBase_DB(self, pBase, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                var oid = res[0][0].OID || 0;
                pBase.setAttrib(gameEnume.baseAttrib.BASE_ATTRIB_ID, oid);
                pPlayerR.addBase(pBase);
                pBaseLogic.sendBaseTo_C(uid, pBase);
                callback(null, arg1);
            })
        },
        function (arg1, callback) {
            //console.log('step4', arg1);
            //卡牌
            var index = 3;
            var returnCardData = [];
            async.mapSeries(tempCardData, function (pItemCard, callback2) {
                var cardId = pItemCard.getValue_1();
                var cardNum = pItemCard.getValue_2();
                logArr.push([cardId, cardNum]);
                cardArr[index] = cardId;
                index++;
                initCardNum += cardNum;
                var pCard = new CardData();
                pCard.setAllAttrib([-1, arg1, cardId, 1, cardNum, 1]);
                pCardLogic.updataCard_DB(self, pCard, function (err, res) {
                    if (!!err) {
                        next(null, {code: code.SERVER.FA_DB_ERROR});
                        return;
                    }
                    var oid = res[0][0].OID || 0;
                    pCard.setAttrib(gameEnume.cardAttrib.CARD_ATTRIB_ID, oid);
                    pPlayerR.addCard(pCard);
                    //添加
                    returnCardData.push(pCard.getAttrib());
                    callback2();
                })
            }, function (err, res) {
                pCardLogic.sendCardTo_C(uid, returnCardData);
                callback(null, arg1);
            })
        },
        function (arg1, callback) {
            //console.log('step4', arg1);
            //卡组
            cardArr[0] = -1;
            cardArr[1] = arg1;
            cardArr[2] = 0;

            pCardLogic.addCardGroup_DB(self, cardArr, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                var cardGroupArr = res;
                var returnCardGroup = [];
                async.mapSeries(cardGroupArr, function (item, callback2) {
                    var pCardGroup = new CardGroupData();
                    pCardGroup.setAllAttrib(item);
                    pPlayerR.addCardGroup(pCardGroup);
                    //添加
                    returnCardGroup.push(pCardGroup.getAttrib());
                    callback2();
                }, function (err, res) {
                    pCardLogic.sendCardGroupTo_C(uid, returnCardGroup);
                    callback(null, arg1);
                })
            })
        },
        function (arg1, callback) {
            //成就记录
            var pNoteData = [-1, arg1, 0, 0, money, 0, initCardNum, tempCardNum, 1, 0, 0, 0, 1, 0, 0, 0];
            pAchieveLogic.updatePlayerNote(self.app, pNoteData, function (err, res) {
                if (!!err) {
                    next(null, {code: code.SERVER.FA_DB_ERROR});
                    return;
                }
                if (res && res.length > 0 && res[0][0]['ECode'] == 0) {
                    pNoteData[0] = res[0][0]['OID'];
                    pPlayerR.setNoteAttrib(pNoteData);
                    //客户端
                    pAchieveLogic.flushAchieveNoteDataToClient(uid, pNoteData);
                }
                callback(null, arg1);
            })
        },
        function (arg1, callback) {
            //商城 不可放置于成就记录前！！！
            var pShopLogic = self.app.get('ShopLogic');
            //客户端
            var returnShop = pShopLogic.getCardShopToClient(pPlayerR);
            pShopLogic.sendShopDataToClient(uid, returnShop);
            callback(null, arg1);
        }
    ], function (err, result) {
        //日志
        logArr.unshift([gameEnume.GoodsAddTypeTbl.Type_Money, money],
            [gameEnume.GoodsAddTypeTbl.Type_Diamond, diamond],
            [gameEnume.GoodsAddTypeTbl.Type_MONEY_TICKET, moneyTicket],
            [gameEnume.GoodsAddTypeTbl.Type_RAND_TICKET, randTicket]);
        pPublicLogic.addNoteLogs(uid, gameEnume.logTypeEnume.register, logArr);
        logger.info('用户%d第一次创建登陆成功', uid);

        self.updatePlayerPowerOnLogin(uid);//玩家体力下发
        cb();
        next(null, {code: code.OK});
    });
}
// 加载一个用户
UserLogic.prototype.loadPlayerRole = function (uid, pid, conserverid, next, cb) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.USER.FA_PLAYER_CREATE_FAIL});
        return false;
    }

    var pCardLogic = this.app.get('CardLogic');
    var pBaseLogic = this.app.get('BaseLogic');
    var pMailsLogic = this.app.get('MailsLogic');
    var pShopLogic = this.app.get('ShopLogic');
    var pGuankaLogic = this.app.get('FightLogic');
    var pBoxLogic = this.app.get('BoxLogic');
    var pAchieveLogic = this.app.get('AchieveLogic');
    var pArenaLogic = this.app.get('ArenaLogic');
    var self = this;
    var pUser = pGameDataMgr.userMgr.getUser(uid);


    if (!pUser) {
        userDb.getPlayerAllInfo(self.app, uid, pid, function (err, res) {
            if (!!err) {
                next(null, {code: code.SERVER.FA_DB_ERROR});
                return;
            }
            console.log('flag,', res);
            var pUserData = new userData(uid);
            pUserData.setConServerID(conserverid);
            var userLength = res && res[dbUserIndex] && res[dbUserIndex].length;


            if (userLength > 0) {
                pUserData.setAllAttrib(res[dbUserIndex]);
            }
            // 添加用户到 channel
            self.msgServer.addtoChannel(uid, conserverid);
            //推送 debug
            /*var channel = self.msgServer.getChannelbySid(conserverid);
             var params = {
             route: 'onAdd',
             user: 'hello world!--' + uid
             };
             channel.pushMessage(params);*/

            var pPlayerR = new playerRoleData(uid);
            pPlayerR.setPid(pid);
            pPlayerR.setAllAttrib(res[dbPlayerRoleIndex]);

            pGameDataMgr.userMgr.addUser(pUserData);
            pUserData.addPlayerRoleData(pPlayerR);
            self.sendPlayerRoleTo_C(uid, pPlayerR);
            // 玩家记录信息
            if (res[dbNoteDataIndex].length == 1) {
                pPlayerR.setNoteAttrib(res[dbNoteDataIndex][0]);
                pAchieveLogic.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());
            } else {
                logger.error("用户%d player_note table data is wrong!!!", uid);
            }
            //加载当前玩家的基地数据 发送到客户端
            if (res[dbBaseDataIndex].length > 0) {
                var baseData = res[dbBaseDataIndex][0];
                var pBase = new BaseData();
                pBase.setAllAttrib(baseData);
                pPlayerR.addBase(pBase);
                // 发送消息到客户端
                pBaseLogic.sendBaseTo_C(uid, pBase);
            }

            // 加载当前玩家的卡牌数据 发送到客户端
            var returnCard = [];
            if (res[dbCardDataIndex].length > 0) {
                for (var i = 0; i < res[dbCardDataIndex].length; i++) {
                    var pCard = new CardData();
                    pCard.setAllAttrib(res[dbCardDataIndex][i]);
                    pPlayerR.addCard(pCard);
                    returnCard.push(pCard.getAttrib());
                }
                // 发送消息到客户端
                pCardLogic.sendCardTo_C(uid, returnCard);
            }
            // 加载当前玩家的挂关卡数据 发送到客户端
            var returnGuanka = [];
            if (res[dbGuankaDataIndex].length > 0) {
                for (var i = 0; i < res[dbGuankaDataIndex].length; i++) {
                    var pGuanka = new GuankaData();
                    pGuanka.setAllAttrib(res[dbGuankaDataIndex][i]);
                    pPlayerR.addGuanka(pGuanka);
                    returnGuanka.push(pGuanka.getAttrib());
                }
                // 发送消息到客户端
                pGuankaLogic.sendGuankaTo_C(uid, returnGuanka);
            }


            // 加载当前玩家的卡组数据 发送到客户端
            var returnCardGroup = [];
            if (res[dbCardGroupDataIndex].length > 0) {
                for (var i = 0; i < res[dbCardGroupDataIndex].length; i++) {
                    var pCardGroup = new CardGroupData();
                    pCardGroup.setAllAttrib(res[dbCardGroupDataIndex][i]);
                    pPlayerR.addCardGroup(pCardGroup);
                    returnCardGroup.push(pCardGroup.getAttrib());
                }
                // 发送卡组消息到客户端
                pCardLogic.sendCardGroupTo_C(uid, returnCardGroup);
            }
            //  玩家邮件数据
            if (res[dbMailDataIndex].length > 0) {
                for (var i = 0; i < res[dbMailDataIndex].length; i++) {
                    var pMailData = new MailsData();
                    pMailData.setAllAttrib(res[dbMailDataIndex][i]);
                    pPlayerR.addMail(pMailData);
                }
            }
            //发送玩家邮件数据
            //消息合理校验(失效时间)
            var constantData = pGameMgr.TableConstant.Data();
            var validDay = constantData[gameEnume.constant.mail_vaild_day_id].getValue_Constant();
            pMailsLogic.sendMailsDataToClient(uid, pMailsLogic.filterMailsData(pPlayerR, validDay));

            //玩家宝箱信息
            var boxDataFromDb = res[dbBoxDataIndex];
            if (boxDataFromDb.length > 0) {
                for (var i = 0; i < boxDataFromDb.length; i++) {
                    var pBoxData = new BoxData();
                    pBoxData.setAllAttrib(boxDataFromDb[i]);
                    pPlayerR.addBox(pBoxData);
                }
                pBoxLogic.flushBoxesDataToClient(uid, pPlayerR.getBoxMgr());
            }
            // 玩家已领取成就
            var gotAchieveDataFromDb = res[dbGotAchieveDataIndex];
            if (gotAchieveDataFromDb.length > 0) {
                for (var i = 0; i < gotAchieveDataFromDb.length; i++) {
                    var pAchieveData = new AchieveData();
                    pAchieveData.setAllAttrib(gotAchieveDataFromDb[i]);
                    pPlayerR.addAchieve(pAchieveData);
                }
                pAchieveLogic.flushGotAchieveDataToClient(uid, pPlayerR.getAchieveMgr());
            }

            //  玩家商城数据
            if (res[dbShopDataIndex].length > 0) {
                for (var i = 0; i < res[dbShopDataIndex].length; i++) {
                    var pShopData = new ShopData();
                    pShopData.setAllAttrib(res[dbShopDataIndex][i]);
                    pPlayerR.addShop(pShopData);
                }
            }
            var returnShop = pShopLogic.getCardShopToClient(pPlayerR);
            pShopLogic.sendShopDataToClient(uid, returnShop);
            // 加载当前玩家荣誉信息 发送到客户端
            var returnHonor = [];
            if (res[dbHonorDataIndex].length > 0) {
                for (var i = 0; i < res[dbHonorDataIndex].length; i++) {
                    returnHonor.push(res[dbHonorDataIndex][i]);
                    pPlayerR.addHonor(res[dbHonorDataIndex][i]);
                }
                // 发送消息到客户端
                self.sendHonorTo_C(uid, returnHonor);
            }

            logger.info('用户%d登陆成功', uid);
            var tribeLogic = self.app.get('TribeLogic');
            // tribeLogic.login();// 　更新部落在线人数
            self.updatePlayerPowerOnLogin(uid);//玩家离线体力恢复
            cb();
            next(null, {code: code.OK});
        });

    } else {

        var pPlayerR = pUser.getPlayerRoleData();
        // 添加用户到 channel
        self.msgServer.addtoChannel(uid, conserverid);
        self.sendPlayerRoleTo_C(uid, pPlayerR);
        //self.sendPlayerRoleInfoTo_C(uid,pPlayerR);
        var pPlayerR = pUser.getPlayerRoleData();
        // 基地发送消息到客户端
        pBaseLogic.sendBaseTo_C(uid, pPlayerR.baseMgr);
        //卡牌
        var returnCard = [];
        for (var i in pPlayerR.cardMgr) {
            var pCardData = pPlayerR.cardMgr[i];
            returnCard.push(pCardData.getAttrib());
        }
        // 发送卡牌消息到客户端
        pCardLogic.sendCardTo_C(uid, returnCard);

        //卡组
        var returnCardGroup = [];
        for (var i in pPlayerR.cardGroupMgr) {
            var pCardGroupData = pPlayerR.cardGroupMgr[i];
            returnCardGroup.push(pCardGroupData.getAttrib());
        }
        // 发送卡组消息到客户端
        pCardLogic.sendCardGroupTo_C(uid, returnCardGroup);

        var constantData = pGameMgr.TableConstant.Data();
        var validDay = constantData[gameEnume.constant.mail_vaild_day_id].getValue_Constant();//有效期
        pMailsLogic.sendMailsDataToClient(uid, pMailsLogic.filterMailsData(pPlayerR, validDay));//发送玩家邮件数据 消息合理校验(失效时间)

        var returnShop = pShopLogic.getCardShopToClient(pPlayerR);
        pShopLogic.sendShopDataToClient(uid, returnShop);//玩家商城信息
        pBoxLogic.flushBoxesDataToClient(uid, pPlayerR.getBoxMgr());//玩家宝箱信息
        pAchieveLogic.flushGotAchieveDataToClient(uid, pPlayerR.getAchieveMgr());// 玩家已领取成就
        pAchieveLogic.flushAchieveNoteDataToClient(uid, pPlayerR.getNoteAttrib());// 玩家记录信息

        //关卡
        var returnGuanka = [];
        for (var i in pPlayerR.guanKaMgr) {
            var pGuankaData = pPlayerR.guanKaMgr[i];
            returnGuanka.push(pGuankaData.getAttrib());
        }
        pGuankaLogic.sendGuankaTo_C(uid, returnGuanka);

        //荣誉
        self.sendHonorTo_C(uid, pPlayerR.getHonor())

        pUser.setCurrTime(0);//checkUserTime中检查

        logger.info('用户%d登陆成功2', uid);
        var tribeLogic = self.app.get('TribeLogic');
        // tribeLogic.login();// 　更新部落在线人数
        self.updatePlayerPowerOnLogin(uid);//玩家离线体力恢复
        cb();
        next(null, {code: code.OK});
    }
}

// 用户推出游戏（网络断开）
UserLogic.prototype.userLeave = function (uid, sid) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameDataMgr == undefined) {
        return false;
    }
    // 删除用户的channel
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    //console.log('pUser,', pUser);
    if (!pUser) {
        logger.info('用户 %d下线 错误，没有这个用户', uid, sid);
        return false;
    }

    if (pUser.getConServerID() != sid) {
        logger.info('用户%d下线sid错误：%d不等于 %d', uid, pUser.getConServerID(), sid);
        return false;
    }
    var currTime = new Date().getTime();
    pUser.setCurrTime(currTime);

    var pPlayerR = pUser.getPlayerRoleData();
    if (pPlayerR == undefined) {
        logger.info('用户 %d下线 错误，没有这个用户角色', uid);
        return false;
    }
    var pTribeLogic = this.app.get('TribeLogic');
    pTribeLogic.leave(uid);//更新部落在线人数

    // 测试检测 看用户是否在channel 中
    //var senn = this.msgServer.getMemeber(uid, sid);
    this.msgServer.deltoChannel(uid, sid);
    //pGameDataMgr.userMgr.removeUser(uid);

    logger.info('用户%d下线成功', uid);
}
// 加载服务器分区列表
UserLogic.prototype.addZones = function () {
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameDataMgr == undefined) {
        return false;
    }
    var self = this;
    userDb.getZoneList(self.app, function (err, result) {
        console.log('test', err, result);
        if (!!err) {
            logger.error('getZoneList failed! ');
        }
        pGameDataMgr.userMgr.zoneDates = result;
        console.log('加载分区列表成功!')
        return;
    })
}
//清除过期用户数据
UserLogic.prototype.checkUserTime = function (minute) {
    var self = this;
    var micrSecond = minute * 60 * 1000;
    var pGameDataMgr = self.app.get('gameDataMgr');
    if (!pGameDataMgr) {
        console.log("服务器数据管理类错误");
        return;
    }
    //console.log('datas', pGameDataMgr.userMgr.userDatas);
    var ii;
    for (ii in pGameDataMgr.userMgr.userDatas) {
        var pUser = pGameDataMgr.userMgr.userDatas[ii];
        if (!pUser)
            continue;
        if (pUser.getCurrTime() == 0) {
            return;
        }
        var curtime = new Date().getTime();
        var subtime = curtime - pUser.getCurrTime();
        console.log('subtime', subtime, curtime, pUser.getCurrTime(), micrSecond, ii);
        if (subtime < micrSecond)
            continue;
        // 从存储删
        pGameDataMgr.userMgr.removeUser(ii);
        console.log('dataend', pGameDataMgr.userMgr.userDatas);
    }
}

//玩家经验值改变
UserLogic.prototype.changeUserExp = function (uid, addExp) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        return false;
    }
    var self = this;
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        return false;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        return false;
    }
    var oldLevel = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL);
    var oldExp = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_EXP);
    var newExp = oldExp + addExp;
    var pUserUpExpTable = pGameMgr.TablePlayerLevel.GetElement(oldLevel);
    var nextExp = pUserUpExpTable.getExp();
    var addLevel = 0;
    while (nextExp > 0 && newExp >= nextExp) {
        newExp = newExp - nextExp;
        addLevel++;
        pUserUpExpTable = pGameMgr.TablePlayerLevel.GetElement(oldLevel + addLevel);
        if (!pUserUpExpTable) {
            console.log('满级了');
            newExp = nextExp;
            addLevel--;
            break;
        }
        nextExp = pUserUpExpTable.getExp();
    }
    var curLevel = oldLevel + addLevel;
    pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_EXP, newExp);
    if (addLevel > 0) {
        pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_LEVEL, curLevel);
    }
    self.updatePlayerRole_DB(self, pPlayerR, function () {
    });
    self.sendPlayerRoleTo_C(uid, pPlayerR);
}

//改昵称
UserLogic.prototype.changeNickName = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var nickName = msg['d'][0]; //昵称

    /*if (nickName.length > 20 || nickName.length < 3) {
     logger.info('用户 %d ，没有这个用户', uid);
     next(null, {code: code.USER.FA_NICKNAME_ERROR});
     return;
     }*/
    var reg = /^[a-zA-Z0-9\u4e00-\u9fa5]{3,6}$/;
    if (!reg.test(nickName)) {
        logger.info('输入昵称错误', nickName);
        next(null, {code: code.USER.FA_NICKNAME_ERROR});
        return;
    }

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
    var userNickName = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName);
    if (nickName == userNickName) {
        logger.info('你已拥有该昵称', userNickName);
        next(null, {code: code.USER.FA_NICKNAME_REPEAT});
        return;
    }
    var pid = pPlayerR.getPid();
    self.updatePlayerNickName_DB(self, [pid, nickName], function (err, res) {
        console.log('chageNickname', err, res);
        if (!!err) {
            next(null, {code: code.SERVER.FA_DB_ERROR});
            return;
        }
        var eCode = res[0][0].ECode;
        if (eCode != 1) {
            next(null, {code: code.USER.FA_NICKNAME_REPEAT});
            return;
        }
        pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_NickName, nickName);
        self.sendPlayerRoleTo_C(uid, pPlayerR);
    });
    next(null, {code: code.OK});

}
//改头像
UserLogic.prototype.changeIcon = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var self = this;
    var uid = session.get('uid');
    var iconStr = msg['d'][0];
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
    var oldIconStr = pPlayerR.getOneAttrib(gameEnume.playerAttrib.icon);
    if (oldIconStr != iconStr) {
        var json = {};
        json[gameEnume.playerAttrib.icon] = iconStr;
        self.updatePlayerRoleSpecial_DB(self, pPlayerR, json, function (err) {
            if (!!err) {
                next(null, {code: code.SERVER.FA_DB_ERROR});
                return;
            }
            pPlayerR.setAttrib(gameEnume.playerAttrib.icon, iconStr);
            self.sendPlayerRoleTo_C(uid, pPlayerR);
        });
    }
    next(null, {code: code.OK});

}
//更新玩家部分属性到数据库
UserLogic.prototype.updatePlayerRoleSpecial_DB = function (self, pPlayerRData, json, cb) {
    var data = pPlayerRData.getAttrib().slice();
    for (var key in json) {
        var index = parseInt(key);
        data[index] = json[key];
    }
    userDb.updatePlayerRole(self.app, data, cb);
}
// 更新玩家人物数据到数据库
UserLogic.prototype.updatePlayerRole_DB = function (self, pPlayerRData, cb) {
    var data = pPlayerRData.getAttrib();
    userDb.updatePlayerRole(self.app, data, cb);
}

// 更新玩家人物昵称数据到数据库
UserLogic.prototype.updatePlayerNickName_DB = function (self, data, cb) {
    userDb.updatePlayerRoleNickName(self.app, data, cb);
}

// 发送人物角色数据到客户端
UserLogic.prototype.sendPlayerRoleTo_C = function (uid, pPlayerR) {
    var route = 'updatePlayerRoleData';
    var data = {d: pPlayerR.getAttrib()};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

UserLogic.prototype.usePlayerPower = function (pPlayerR, minusPower) {
    var self = this;
    var pGameMgr = this.app.get('gameMgr');
    if (!pGameMgr) {
        logger.error('userLogic.usePlayerPower gameMgr is empty !');
        return false;
    }
    var constantTableData = pGameMgr.TableConstant.Data();
    if (!constantTableData) {
        logger.error('userLogic.usePlayerPower constantData is empty !');
        return false;
    }
    var maxPower = utils.getConstantValue(constantTableData, gameEnume.constant.maxPower);
    var minutesOf1Power = utils.getConstantValue(constantTableData, gameEnume.constant.minutesOf1Power);
    if (!maxPower || !minutesOf1Power) {
        logger.error('userLogic.usePlayerPower maxPower||minutesOf1Power is empty !');
        return false;
    }
    var oldPower = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power);
    var newPower = oldPower - minusPower < 0 ? 0 : oldPower - minusPower;
    var startPlayerPowerRaiseCountdown = (oldPower >= maxPower && newPower < maxPower);
    if (startPlayerPowerRaiseCountdown) {
        this.startPlayerPowerRaise(pPlayerR, newPower, maxPower, minutesOf1Power);
    } else {
        var json = {};
        json[gameEnume.playerAttrib.power] = newPower;
        self.updatePlayerRoleSpecial_DB(self, pPlayerR, json, function (err) {
            if (!err) {
                pPlayerR.setAttrib(gameEnume.playerAttrib.power, newPower);
                var countdown = self.getPowerCountdown(pPlayerR, newPower, maxPower, minutesOf1Power);
                var buyNum = self._getPower_buy_num(pPlayerR);
                self._sendPlayerPowerDataToClient(pPlayerR.uid, [newPower, countdown, buyNum]);
            }
        });
    }
    return true;
}
//体力消耗导致体力开始自动恢复计时
UserLogic.prototype.startPlayerPowerRaise = function (pPlayerR, newPower, maxPower, minutesOf1Power) {
    var self = this;
    var json = {};
    var currTime = utils.getCurrTime();
    json[gameEnume.playerAttrib.power_start_countdown_time] = currTime;
    json[gameEnume.playerAttrib.power_last_raise_time] = currTime;
    json[gameEnume.playerAttrib.power] = newPower;
    self.updatePlayerRoleSpecial_DB(self, pPlayerR, json, function (err) {
        if (!err) {
            pPlayerR.setAttrib(gameEnume.playerAttrib.power_start_countdown_time, currTime);
            pPlayerR.setAttrib(gameEnume.playerAttrib.power_last_raise_time, currTime);
            pPlayerR.setAttrib(gameEnume.playerAttrib.power, newPower);
            var countdown = self.getPowerCountdown(pPlayerR, newPower, maxPower, minutesOf1Power);
            var buyNum = self._getPower_buy_num(pPlayerR);
            self._sendPlayerPowerDataToClient(pPlayerR.uid, [newPower, countdown, buyNum]);
        }
    });

};
UserLogic.prototype.buyPlayerPower = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        return;
    }
    var constantData = pGameMgr.TableConstant.Data();
    if (!constantData) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var constantPowersPerBuyGetData = constantData[gameEnume.constant.powersPerBuyGet];
    var constantDiamondsCostsBuyPowersPerTimeData = constantData[gameEnume.constant.diamondsCostsBuyPowersPerTime];
    if (!constantPowersPerBuyGetData || !constantDiamondsCostsBuyPowersPerTimeData) {
        logger.error('userLogic.buyPlayerPower powersPerBuyGet、diamondsCostsBuyPowersPerTime is empty !');
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var powersPerBuyGet = constantPowersPerBuyGetData.getValue_Constant();
    var diamondsCostsBuyPowersPerTimes = constantDiamondsCostsBuyPowersPerTimeData.getValueE_Constant();
    var needDiamonds = this._calculateCostByBuyPlayerPower(pPlayerR, diamondsCostsBuyPowersPerTimes);
    var oldDiamonds = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND);
    if (needDiamonds > oldDiamonds) {
        next(null, {code: code.SERVER.FA_DIAMOND_NOT_ENOUGH});
        return;
    }
    var newDiamonds = oldDiamonds - needDiamonds;
    var oldPlayerPower = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power);
    var newPlayerPower = oldPlayerPower + powersPerBuyGet;
    this._buyPlayerPower(pPlayerR, newDiamonds, newPlayerPower);
    next(null, {code: code.OK});
}
UserLogic.prototype._calculateCostByBuyPlayerPower = function (pPlayerR, diamondsCostsBuyPowersPerTimes) {
    var power_last_buy_time = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.power_last_buy_time);
    if (utils.isToday(power_last_buy_time)) {
        var oldPower_buy_num = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.power_buy_num);
        var newPower_buy_num = oldPower_buy_num + 1;
        var index = newPower_buy_num > diamondsCostsBuyPowersPerTimes.length ? diamondsCostsBuyPowersPerTimes.length - 1 : newPower_buy_num - 1;
        return diamondsCostsBuyPowersPerTimes[index];
    } else {
        return diamondsCostsBuyPowersPerTimes[0];
    }
};
UserLogic.prototype._getPower_buy_num = function (pPlayerR) {
    var power_last_buy_time = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.power_last_buy_time);
    if (utils.isToday(power_last_buy_time)) {
        var oldPower_buy_num = pPlayerR.getOneNoteAttrib(gameEnume.noteAttrib.power_buy_num);
        return oldPower_buy_num;
    } else {
        return 0;
    }
};
UserLogic.prototype._buyPlayerPower = function (pPlayerR, newDiamonds, newPlayerPower) {
    var self = this;
    var pAchieveLogic = self.app.get('AchieveLogic');
    var newPower_buy_num = self._getPower_buy_num(pPlayerR) + 1;
    var currTime = utils.getCurrTime();
    async.series([
            function (cb) {
                var json1 = {};
                json1[gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND] = newDiamonds;
                json1[gameEnume.playerAttrib.power] = newPlayerPower;
                self.updatePlayerRoleSpecial_DB(self, pPlayerR, json1, function (err) {
                    if (!err) {
                        cb();
                    }
                });
            },
            function (cb) {
                var json2 = {};
                json2[gameEnume.noteAttrib.power_buy_num] = newPower_buy_num;
                json2[gameEnume.noteAttrib.power_last_buy_time] = currTime;
                pAchieveLogic.updateSpecialPlayerNote_DB(self.app, pPlayerR, json2, function (err) {
                    if (!err) {
                        cb();
                    }
                });
            }
        ],
        function (err, result) {
            if (!err) {
                pPlayerR.setAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_DIAMOND, newDiamonds);
                pPlayerR.setAttrib(gameEnume.playerAttrib.power, newPlayerPower);
                self._sendPlayerPowerDataToClient(pPlayerR.uid, [newPlayerPower, -1, newPower_buy_num]);
                self.sendPlayerRoleTo_C(pPlayerR.uid, pPlayerR);

                pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.power_buy_num, newPower_buy_num);
                pPlayerR.setOneNoteAttrib(gameEnume.noteAttrib.power_last_buy_time, currTime);
                pAchieveLogic.flushAchieveNoteDataToClient(pPlayerR.uid, pPlayerR.getNoteAttrib());
            } else {
                logger.err('err happen in UserLogic _buyPlayerPower');
            }
        });
};
UserLogic.prototype.updatePlayerPower = function (msg, session, next) {
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.info('用户 %d ，没有这个用户', uid);
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.info('用户 %d没有角色信息', uid);
        return;
    }
    var constantData = pGameMgr.TableConstant.Data();
    if (!constantData) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var constantMaxPowerData = constantData[gameEnume.constant.maxPower];
    var constantMinutesOf1PowerData = constantData[gameEnume.constant.minutesOf1Power];
    if (!constantMaxPowerData || !constantMinutesOf1PowerData) {
        logger.error('userLogic.updatePlayerPower maxPower、minutesOf1Power is empty !');
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var maxPower = constantMaxPowerData.getValue_Constant();
    var minutesOf1Power = constantMinutesOf1PowerData.getValue_Constant();
    var oldPower = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power);
    if (oldPower >= maxPower) {
        next(null, {code: code.USER.FA_POWER_FULL});
        return;
    }
    var currTime = utils.getCurrTime();
    var addPower = this._getAddPlayerPowersByNormal(pPlayerR, minutesOf1Power);
    this._addPlayerPowerOnNormal(pPlayerR, oldPower, addPower, maxPower, minutesOf1Power);
    next(null, {code: code.OK});
}
UserLogic.prototype.updatePlayerPowerOnLogin = function (uid) {
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (!pGameDataMgr) {
        logger.error('userLogic.updatePlayerPowerOnLogin pGameDataMgr is empty !');
        return;
    }
    var pUser = pGameDataMgr.userMgr.getUser(uid);
    if (!pUser) {
        logger.error('userLogic.updatePlayerPowerOnLogin pUser is empty !');
        return;
    }
    var pPlayerR = pUser.getPlayerRoleData();
    if (!pPlayerR) {
        logger.error('userLogic.updatePlayerPowerOnLogin pPlayerR is empty !');
        return;
    }
    var pGameMgr = this.app.get('gameMgr');
    if (!pGameMgr) {
        return;
    }
    var constantData = pGameMgr.TableConstant.Data();
    if (!constantData) {
        logger.error('userLogic.updatePlayerPowerOnLogin constantData is empty !');
        return;
    }
    var constantMaxPowerData = constantData[gameEnume.constant.maxPower];
    var constantMinutesOf1PowerData = constantData[gameEnume.constant.minutesOf1Power];
    if (!constantMaxPowerData || !constantMinutesOf1PowerData) {
        logger.error('userLogic.updatePlayerPowerOnLogin maxPower、minutesOf1Power is empty !');
        return;
    }
    var oldPower = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power);
    var maxPower = constantMaxPowerData.getValue_Constant();
    var minutesOf1Power = constantMinutesOf1PowerData.getValue_Constant();
    var addPower = this._getAddPlayerPowersByNormal(pPlayerR, minutesOf1Power);
    this._addPlayerPowerOnNormal(pPlayerR, oldPower, addPower, maxPower, minutesOf1Power);

}
UserLogic.prototype.getPowerCountdown = function (pPlayerR, playerPower, maxPower, minutesOf1Power) {
    var powerIsFull = playerPower >= maxPower;
    if (powerIsFull) {
        return -1;
    } else {
        return this._getCountdownWithNotPowerIsFull(pPlayerR, minutesOf1Power);
    }
}
UserLogic.prototype._getCountdownWithNotPowerIsFull = function (pPlayerR, minutesOf1Power) {
    var maxCountdown = minutesOf1Power * 60;
    var power_start_countdown_time = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power_start_countdown_time);
    if (utils.isTime(power_start_countdown_time)) {
        return maxCountdown - Math.abs(utils.getCurrTime() - power_start_countdown_time) % maxCountdown;
    } else {
        return -1;
    }
}
UserLogic.prototype._addPlayerPowerOnNormal = function (pPlayerR, oldPower, addPower, maxPower, minutesOf1Power) {
    var self = this;

    var newPower = oldPower + addPower;
    if (newPower > maxPower) {
        newPower = maxPower;
    }
    var powerIsFull = (newPower == maxPower);

    var powerBuyNum = self._getPower_buy_num(pPlayerR);
    var countdown = self.getPowerCountdown(pPlayerR, newPower, maxPower, minutesOf1Power)
    if (addPower == 0) {
        self._sendPlayerPowerDataToClient(pPlayerR.uid, [oldPower, countdown, powerBuyNum]);
    }
    if (addPower > 0) {
        var json = {};
        var currTime = utils.getCurrTime();
        if (powerIsFull) {
            json[gameEnume.playerAttrib.power_start_countdown_time] = -1;
        }
        json[gameEnume.playerAttrib.power] = newPower;
        json[gameEnume.playerAttrib.power_last_raise_time] = currTime;
        self.updatePlayerRoleSpecial_DB(self, pPlayerR, json, function (err) {
            if (!err) {
                if (powerIsFull) {
                    pPlayerR.setAttrib(gameEnume.playerAttrib.power_start_countdown_time, -1);
                }
                pPlayerR.setAttrib(gameEnume.playerAttrib.power, newPower);
                pPlayerR.setAttrib(gameEnume.playerAttrib.power_last_raise_time, currTime);
                self._sendPlayerPowerDataToClient(pPlayerR.uid, [newPower, countdown, powerBuyNum]);
            }
        });
    }
}
UserLogic.prototype._getAddPlayerPowersByNormal = function (pPlayerR, minutesOf1Power) {
    var power_start_countdown_time = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power_start_countdown_time);
    var power_last_raise_time = pPlayerR.getOneAttrib(gameEnume.playerAttrib.power_last_raise_time);
    if (!utils.isTime(power_start_countdown_time) || !utils.isTime(power_start_countdown_time)) {
        return 0;
    }
    var minutes = (utils.getCurrTime() - power_last_raise_time) / 60;
    return Math.floor(minutes / minutesOf1Power);
}
// 发送人物角色体力数据到客户端
UserLogic.prototype._sendPlayerPowerDataToClient = function (uid, data) {
    var route = 'OnUpdatePlayerPowerData';
    var data = {d: data};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

// 发送用户数据到客户端
UserLogic.prototype.sendMsgOkTo_C = function (uid, state) {
    var route = 'msgServerOk';
    var data = {d: state};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}

// 发送荣誉数据到客户端
UserLogic.prototype.sendHonorTo_C = function (uid, hData) {
    var route = 'OnUpdateHonor';
    var data = {d: hData};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}
UserLogic.prototype.kickByAnother = function (uid, sid) {
    logger.info('用户%d被顶号，发送客户端通知', uid);
    // this.msgServer.addtoChannel(uid, sid);
    this.sendKickByAnotherTo_C(uid, '');
}
// 发送顶号消息到客户端
UserLogic.prototype.sendKickByAnotherTo_C = function (uid, info) {
    var route = 'OnKickByAnother';
    var data = {d: info};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}