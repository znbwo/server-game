var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);
var gameEnume = require('../gameData/gameEnume');
var code = require('../gameData/code');
var async = require('async');
var utils = require('../../util/utils');
var MailDb = require('../../mysql/mailDb');
var gameMgr = require('../gameData/gameMgr');
var MailsData = require('../gameData/mailsData');

var MailsLogic = function (app) {
    this.app = app;
    this.msgServer = this.app.get('msgServer');
}

module.exports = MailsLogic;
/**
 * 玩家添加邮件
 * @param pPlayerR
 * @param mailData
 */
MailsLogic.prototype.addMail = function (pPlayerR, mailId, boxId, dynamicContent) {
    var pid = pPlayerR.getPid();
    var uid = pPlayerR.getOneAttrib(gameEnume.playerAttrib.PLAYER_ATTRIB_UID);
    var data = [-1, pid, mailId, boxId, utils.getCurrTime(), 0, 0, dynamicContent];
    var self = this;
    MailDb.updatePlayerMails(this.app, data, function (err, res) {
        data[0] = res[0][0].OID;
        var pMailData = new MailsData();
        pMailData.setAllAttrib(data);
        pPlayerR.addMail(pMailData);
        self.sendMailsDataToClient(uid, [data]);
    });
};

MailsLogic.prototype.applyMails = function (msg, session, next) {
    //参数检测
    var getMailBox = msg['d'][1];
    //读邮件
    if (getMailBox == 0) {
        this.readMail(msg, session, next);
    } else {
        //领附件
        this.takeMailAttach(msg, session, next);
    }
};
//用户阅读邮件
MailsLogic.prototype.readMail = function (msg, session, next) {
    var self = this;
    //参数检测
    var pMailId = msg['d'][0];
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var pUserData = pGameDataMgr.userMgr.getUser(uid);
    if (pUserData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pRoleDataMgr = pUserData.getPlayerRoleData();
    if (pRoleDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pMailsData = pRoleDataMgr.mailMgr[pMailId];
    if (pMailsData == undefined) {
        next(null, {code: code.MAILS.FA_NOT_HAVE_MID});
        return;
    }
    //消息合理校验(与失效时间)
    var constantData = pGameMgr.TableConstant.Data();
    if (constantData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var constantTableData = constantData[gameEnume.constant.mail_vaild_day_id];
    if (constantTableData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var day = constantTableData.getValue_Constant();
    var validOfSecond = this.checkTimeValid(pMailsData.getAttrib()[gameEnume.mailAttrib.MAIL_ATTRIB_GET_TIME], day);
    if (validOfSecond < 0) {
        next(null, {code: code.MAILS.FA_OUT_TIME});
        return;
    }
    //是否已读
    if (pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_IS_READ] === 1) {
        next(null, {code: code.MAILS.FA_READ_ALREADY});
        return;
    }
    //变更消息状态
    pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_IS_READ] = 1;
    MailDb.updatePlayerMails(this.app, pMailsData.attrib, function () {
        //将变更后的消息推送客户端
        self.sendMailsDataToClient(uid, [pMailsData.getAttrib()]);
    });
    //返回客户端消息
    next(null, {code: code.OK, d: []});
}


//用户领取邮件附件
MailsLogic.prototype.takeMailAttach = function (msg, session, next) {
    var self = this;
    var publicLogic = this.app.get('PublicLogic');
    var pBoxLogic = this.app.get('BoxLogic');
    //参数检测
    var pMailId = msg['d'][0];
    var pGameMgr = this.app.get('gameMgr');
    var pGameDataMgr = this.app.get('gameDataMgr');
    if (pGameMgr == undefined || pGameDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_SERVER_DATA});
        return;
    }
    var uid = session.get('uid');
    var pUserData = pGameDataMgr.userMgr.getUser(uid);
    if (pUserData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_USER_DATA});
        return;
    }
    var pRoleDataMgr = pUserData.getPlayerRoleData();
    if (pRoleDataMgr == undefined) {
        next(null, {code: code.SERVER.FA_NOT_PLAYER_DATA});
        return;
    }
    var pMailsData = pRoleDataMgr.mailMgr[pMailId];
    if (pMailsData == undefined) {
        next(null, {code: code.MAILS.FA_NOT_HAVE_MID});
        return;
    }
    //消息合理校验(与失效时间)
    var constantData = pGameMgr.TableConstant.Data();
    if (constantData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var constantTableData = constantData[gameEnume.constant.mail_vaild_day_id];
    if (constantTableData == undefined) {
        next(null, {code: code.SERVER.FA_NOT_TABLE_DATA});
        return;
    }
    var day = constantTableData.getValue_Constant();
    var validOfSecond = this.checkTimeValid(pMailsData.getAttrib()[gameEnume.mailAttrib.MAIL_ATTRIB_GET_TIME], day);
    if (validOfSecond < 0) {
        next(null, {code: code.MAILS.FA_OUT_TIME});
        return;
    }
    //消息合理校验(消息否有附件)
    var mailBoxId = pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_BID];
    if (mailBoxId <= 0) {
        next(null, {code: code.MAILS.FA_NOT_HAVE_ATTACH});
        return;
    }
    //是否已领
    if (pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_IS_TOKE] === 1) {
        next(null, {code: code.MAILS.FA_TOKE_ALREADY});
        return;
    }

    var boxId = pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_BID];
    var boxDataInfo = pGameMgr.TableTreasuerBoxInfo.Data()[boxId];
    if (boxDataInfo == undefined) {
        next(null, {code: code.MAILS.FA_NOT_EXIST_ATTACH});
        return;
    }
    var goods = pBoxLogic.getCurrency(boxDataInfo);
    var cards = pBoxLogic.getRandomCards(boxDataInfo);
    var result = goods.concat(cards);
    publicLogic.addGoods(pRoleDataMgr, result, gameEnume.logTypeEnume.mail);
    publicLogic.sendAddGoodsTo_C(uid, result, boxId);

    //变更邮件状态
    pMailsData.attrib[gameEnume.mailAttrib.MAIL_ATTRIB_IS_TOKE] = 1;
    MailDb.updatePlayerMails(this.app, pMailsData.attrib, function () {
        self.sendMailsDataToClient(uid, [pMailsData.getAttrib()]);
    });
    //返回客户端参数
    next(null, {code: code.OK, d: []});
};

/**
 * 过滤过期邮件
 * @param day 邮件有效期
 * @returns {*} 返回在有效期内的邮件属性数组
 */
MailsLogic.prototype.filterMailsData = function (pRoleDataMgr, day) {
    //玩家登录时
    var returnMails = [];
    var invalidMails = [];
    for (var i in pRoleDataMgr.mailMgr) {
        var pMailData = pRoleDataMgr.mailMgr[i];
        if (!pMailData) {
            continue;
        }
        //消息对象属性数组
        var mailsArr = pMailData.getAttrib();
        //邮件没过期
        if (this.checkTimeValid(mailsArr[gameEnume.mailAttrib.MAIL_ATTRIB_GET_TIME], day) > 0) {
            returnMails.push(mailsArr);
        } else {
            // 准备删除该消息
            //　内存删除
            delete pRoleDataMgr.mailMgr[i];
            invalidMails.push(mailsArr[gameEnume.mailAttrib.MAIL_ATTRIB_ID]);
        }
    }
    if (invalidMails.length > 0) {
        //数据库删除
        var data = '(' + invalidMails.toString().replace('[', '').replace(']', '') + ')';
        MailDb.delPlayerMails(this.app, data, function () {
        });
    }
    return returnMails;
};

/**
 * 确认邮件是否过期
 * @param getMailTime
 * @param validDay
 * @returns {number}
 */
MailsLogic.prototype.checkTimeValid = function (getMailTime, validDay) {
    return (getMailTime - 0 + validDay * 24 * 60 * 60 ) - utils.getCurrTime();
};

MailsLogic.prototype.sendMailsDataToClient = function (uid, dataArr) {
    var route = 'OnUpdataMails';
    var data = {d: dataArr};
    this.msgServer.pushMessageToPlayer(uid, route, data);
}


