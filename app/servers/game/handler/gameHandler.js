var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver', __filename);

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.sendMsgOk = function (session, isState) {
    var pUserLogic = this.app.get('UserLogic');
    if (!pUserLogic)
        return;
    var uid = session.get('uid');
    pUserLogic.sendMsgOkTo_C(uid, isState);
}

//用户改昵称
handler.changeNickName = function (msg, session, next) {
    var pUserLogic = this.app.get('UserLogic');
    if (!pUserLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    //用户进入游戏处理
    pUserLogic.changeNickName(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//卡牌升级
handler.upLevelCard = function (msg, session, next) {
    var pCardLogic = this.app.get('CardLogic');
    if (!pCardLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pCardLogic.upLevelCard(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//卡牌换位
handler.replaceCard = function (msg, session, next) {
    var pCardLogic = this.app.get('CardLogic');
    if (!pCardLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pCardLogic.replaceCard(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//更改卡牌状态
handler.changeSaveStatus = function (msg, session, next) {
    var pCardLogic = this.app.get('CardLogic');
    if (!pCardLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pCardLogic.changeSaveCard(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//更改选中卡组
/*handler.updateGroup = function (msg, session, next) {
    var pCardLogic = this.app.get('CardLogic');
    if (!pCardLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pCardLogic.updateCardGroup(msg, session, next);
    //this.sendMsgOk(session, 1);
}*/

//基地升级
handler.upLevelBase = function (msg, session, next) {
    var pBaseLogic = this.app.get('BaseLogic');
    if (!pBaseLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pBaseLogic.upLevelBase(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//开始战斗
handler.startBettle = function (msg, session, next) {
    var pFightLogic = this.app.get('FightLogic');
    if (!pFightLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pFightLogic.fightStart(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//开始战斗
handler.bettleIsOk = function (msg, session, next) {
    var pFightLogic = this.app.get('FightLogic');
    if (!pFightLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pFightLogic.bettleIsOk(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//结束战斗
handler.endBettle = function (msg, session, next) {
    var pFightLogic = this.app.get('FightLogic');
    if (!pFightLogic) {
        //this.sendMsgOk(session, 0);
        next();
        return false;
    }
    pFightLogic.fightEnd(msg, session, next);
    //this.sendMsgOk(session, 1);
}

//用户邮件处理
handler.applyMail = function (msg, session, next) {
    var mailsLogic = this.app.get('MailsLogic');
    if (!mailsLogic) {
        next();
        return false;
    }
    mailsLogic.applyMails(msg, session, next);
};

//用户商城处理
handler.applyShop = function (msg, session, next) {
    var shopLogic = this.app.get('ShopLogic');
    if (!shopLogic) {
        next();
        return false;
    }
    shopLogic.applyShop(msg, session, next);
};

//用户商城刷新
handler.updateShop = function (msg, session, next) {
    var shopLogic = this.app.get('ShopLogic');
    if (!shopLogic) {
        next();
        return false;
    }
    shopLogic.updateCard(msg, session, next);
};
//宝箱开始倒计时
handler.boxCountdown=function(msg, session, next) {
    var boxLogic = this.app.get('BoxLogic');
    if (!boxLogic) {
        next();
        return false;
    }
    boxLogic.boxCountdown(msg, session, next);
};
//玩家开宝箱
handler.boxOpen=function(msg, session, next) {
    var boxLogic = this.app.get('BoxLogic');
    if (!boxLogic) {
        next();
        return false;
    }
    boxLogic.boxOpen(msg, session, next);
};

//gm
handler.addItem=function(msg, session, next) {
    var publicLogic = this.app.get('PublicLogic');
    if (!publicLogic) {
        next();
        return false;
    }
    publicLogic.addItem(msg, session, next);
};

//获取总排名
handler.getSumRank=function(msg, session, next) {
    var pRankLogic = this.app.get('RankLogic');
    if (!pRankLogic) {
        next();
        return false;
    }
    pRankLogic.getSumRank(msg, session, next);
};

//获取城市排名
handler.getCityRank=function(msg, session, next) {
    var pRankLogic = this.app.get('RankLogic');
    if (!pRankLogic) {
        next();
        return false;
    }
    pRankLogic.getCityRank(msg, session, next);
};
//test
handler.test=function(msg, session, next) {
    var pPublicLogic = this.app.get('PublicLogic');
    if (!pPublicLogic) {
        next();
        return false;
    }
    pPublicLogic.test(msg, session, next);
};
//领取成就
handler.applyAchieve = function (msg, session, next) {
    var achieveLogic = this.app.get('AchieveLogic');
    if (!achieveLogic) {
        next();
        return false;
    }
    achieveLogic.applyAchieve(msg, session, next);
};
/** 新手引导记录*/
handler.newPlayerGuaidNote = function (msg, session, next) {
    var achieveLogic = this.app.get('AchieveLogic');
    if (!achieveLogic) {
        next();
        return false;
    }
    achieveLogic.newPlayerGuaidNote(msg, session, next);
};
/** 限时折扣卡牌*/
handler.discountCard = function (msg, session, next) {
    var shopLogic = this.app.get('ShopLogic');
    if (!shopLogic) {
        next();
        return false;
    }
    shopLogic.discountCard(msg, session, next);
};

handler.getRankInfo = function (msg, session, next) {
    var pRankLogic = this.app.get('RankLogic');
    if (!pRankLogic) {
        next();
        return false;
    }
    pRankLogic.getRankInfo(msg, session, next);
};
//变更头像
handler.changeIcon = function (msg, session, next) {
    var pUserLogic = this.app.get('UserLogic');
    if (!pUserLogic) {
        next();
        return false;
    }
    pUserLogic.changeIcon(msg, session, next);
}
//玩家体力恢复
handler.updatePlayerPower = function (msg, session, next) {
    var pUserLogic = this.app.get('UserLogic');
    if (!pUserLogic) {
        next();
        return false;
    }
    pUserLogic.updatePlayerPower(msg, session, next);
}
//玩家体力购买
handler.buyPlayerPower = function (msg, session, next) {
    var pUserLogic = this.app.get('UserLogic');
    if (!pUserLogic) {
        next();
        return false;
    }
    pUserLogic.buyPlayerPower(msg, session, next);
}
handler.getTribeList = function (msg, session, next) {
    var pTribeLogic = this.app.get('TribeLogic');
    if (!pTribeLogic) {
        next();
        return false;
    }
    pTribeLogic.getTribeList(msg, session, next);
};

