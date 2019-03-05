module.exports = {
    //////////////// 所有表格的枚举定义///////////////////
    // 表格中 对象类型定义 表的 type 枚举 对应的奖励类型
    InitUser_TableType: {
        TABLE_Type_PLAYER: 1,    // 给人物奖励数据
        TABLE_Type_Card: 2,      // 给玩家初始卡牌
        TABLE_Type_Base: 3,      // 给玩家初始基地
    },
    GoodsCostTypeTbl: {
        Type_Money: 8888,                        //消耗金币
        Type_Diamond: 9999,                      //钻石
        Type_MONEY_TICKET: 7777,                 //金币关卡入场券
        Type_RAND_TICKET: 6666,                  //随机关卡入场券
    },
    GoodsAddTypeTbl: {
        Type_Money: 8888,                        //金币
        Type_Diamond: 9999,                      //钻石
        Type_MONEY_TICKET: 7777,                 //金币关卡入场券
        Type_RAND_TICKET: 6666,                  //随机关卡入场券
        Type_PLAYER_EXP: 5555,                   //玩家经验
        Type_PLAYER_CARD: 4444,                  //卡牌
        Type_PLAYER_BOX: 3333,                   //宝箱
        Type_PLAYER_MEDAL: 1111,                 //勋章

    },

    //////////////////////////end////////////////////////////
    /////////////////////属性枚举定义//////////////////////////
    // 用户属性标示定义
    userAttrib: {
        USER_ATTRIB_UID: 0,                //用户ID
        USER_ATTRIB_Name: 1,               //账号
        USER_ATTRIB_Pwd: 2,                //密码
        USER_ATTRIB_FROM: 3,               //用户来源
        USER_ATTRIB_LoginCount: 4,         //登录次数
        USER_ATTRIB_LastLoginTime: 5,      //登录时间
    },
    // 玩家属性标示定义
    playerAttrib: {
        PLAYER_ATTRIB_PID: 0,              //人物的角色ID
        PLAYER_ATTRIB_UID: 1,              //用户ID
        PLAYER_ATTRIB_LEVEL: 2,            //人物的等级
        PLAYER_ATTRIB_EXP: 3,              //人物的经验
        PLAYER_ATTRIB_MONEY: 4,            //人物的金钱
        PLAYER_ATTRIB_DIAMOND: 5,          //人物的钻石
        PLAYER_ATTRIB_MONEY_TICKET: 6,     //人物的金币关卡入场券
        PLAYER_ATTRIB_RAND_TICKET: 7,      //人物的随机关卡入场券
        PLAYER_ATTRIB_HIGHT_SCORE: 8,      //人物的单场最高成绩
        PLAYER_ATTRIB_HIGHT_RANK: 9,       //人物的最高排名
        PLAYER_ATTRIB_MEDAL: 10,           //人物的勋章数
        PLAYER_ATTRIB_NickName: 11,        //昵称
        PLAYER_ATTRIB_IsOverM: 12,         //是否超出 每日勋章数
        PLAYER_ATTRIB_CURGUAN: 13,         //当前关卡ID
        PLAYER_ATTRIB_CURGROUP: 14,        //当前卡组
        power: 15,                         //玩家体力
        power_start_countdown_time: 16,    //体力开始自动恢复时间
        icon: 17,                          //头像
        tribeBoxItem_Num: 18,              //部落宝箱祭祀券
        tower_money: 19,                   //试炼币（千层塔商城）
        pvp_money: 20,                     //竞技场币（竞技场商城）
        pvp_ticket: 21,                    //竞技场入场券
        tribeId: 22,                       //部落
        power_last_raise_time: 23,         //体力上次恢复时间

    },
    //玩家信息记录数据结构属性
    noteAttrib: {
        NOTE_ATTRIB_ID: 0,                   //动态自增ID
        NOTE_ATTRIB_PID: 1,                  //人物的角色ID
        NOTE_ATTRIB_normalNum: 2,            //常规模式通关数
        NOTE_ATTRIB_limitNum: 3,             //限时模式通关数
        NOTE_ATTRIB_addGods: 4,              //共获得金币数
        NOTE_ATTRIB_costGods: 5,             //共消耗金币数
        NOTE_ATTRIB_gotCardsNum: 6,          //共获得卡牌数
        NOTE_ATTRIB_cardKindNum: 7,          //卡牌种类数
        NOTE_ATTRIB_bigRound: 8,             //玩家所处章节
        NOTE_ATTRIB_rewardCard: 9,           //奖励卡牌ID
        NOTE_ATTRIB_cardDropTime: 10,        //卡牌掉落时间
        NOTE_ATTRIB_newPlayerGuide: 11,      //新手引导进度
        roundId: 12,                         //商城记录章节
        power_buy_num: 13,                   //今日体力购买次数
        power_last_buy_time: 14,             //上次体力购买时间
        tribeGuide: 15,                      //部落引导记录点

    },
    // 游戏基地属性标示定义
    baseAttrib: {
        BASE_ATTRIB_ID: 0,                  //卡牌动态自增ID
        BASE_ATTRIB_PID: 1,                 //人物角色ID
        BASE_ATTRIB_BID: 2,                 //基地配表ID
        BASE_ATTRIB_LEVEL: 3,               //等级
        BASE_ATTRIB_EXP: 4,                 //经验值
    },
    // 游戏卡牌属性标示定义
    cardAttrib: {
        CARD_ATTRIB_ID: 0,                   //卡牌动态自增ID
        CARD_ATTRIB_PID: 1,                  //人物角色ID
        CARD_ATTRIB_CID: 2,                  //卡牌配表ID
        CARD_ATTRIB_LEVEL: 3,                //等级
        CARD_ATTRIB_NUM: 4,                  //数量
        CARD_ATTRIB_ISLOCK: 5,               //是否保护 1未 2保护

        CARD_ATTRIB_LOCK_STATUS_ARR: [1, 2]
    },
    // 游戏卡组属性标示定义
    cardGroupAttrib: {
        CARDGroup_ATTRIB_ID: 0,              //卡牌动态自增ID
        CARDGroup_ATTRIB_PID: 1,             //人物角色ID
        CARDGroup_ATTRIB_GTYPE: 2,           //卡组类型
        CARDGroup_ATTRIB_C1: 3,              //卡牌ID
        CARDGroup_ATTRIB_C2: 4,              //卡牌ID
        CARDGroup_ATTRIB_C3: 5,              //卡牌ID
        CARDGroup_ATTRIB_C4: 6,              //卡牌ID
        CARDGroup_ATTRIB_C5: 7,              //卡牌ID
        CARDGroup_ATTRIB_C6: 8,              //卡牌ID
        CARDGroup_ATTRIB_C7: 9,              //卡牌ID
        CARDGroup_ATTRIB_C8: 10,             //卡牌ID
    },
    // 关卡属性标示定义
    guankaAttrib: {
        GUANQIA_ATTRIB_ID: 0,               //关卡动态自增ID
        GUANQIA_ATTRIB_PID: 1,              //人物的角色ID
        GUANQIA_ATTRIB_CITY: 2,             //城市ID
        GUANQIA_ATTRIB_SaveGuan: 3,         //存档关卡ID
        GUANQIA_ATTRIB_DailyMedal: 4,       //每日勋章数
        GUANQIA_ATTRIB_Round: 5,            //首次波数奖励
        GUANQIA_ATTRIB_LastGuan: 6,         //最后关卡ID 不为0则通关
        GUANQIA_ATTRIB_NextLastGuan: 7,     //下一城最后一关
        GUANQIA_ATTRIB_SerialTimes: 8,      //连续波数
        GUANQIA_ATTRIB_GenF: 9,      //常规首次
        GUANQIA_ATTRIB_GenL: 10,     //常规极限
        GUANQIA_ATTRIB_LimF: 11,     //限时首次
        GUANQIA_ATTRIB_LimL: 12,     //限时极限
    },
    // 主基地升级规则
    baseUpAttrib: {
        BUILD_ATTRIB_BID: 0,               //动态唯一ID
        BUILD_ATTRIB_PID: 1,               //人物的角色ID
        BUILD_ATTRIB_TYPE: 2,              //建筑类型
        BUILD_ATTRIB_LEVEL: 3,             //建筑等级
        BUILD_ATTRIB_IsStart: 4,           //是否开始升级 0未开始 1已开始
        BUILD_ATTRIB_StartTime: 5,         //开始升级时间
    },
    // 大区数据结构属性
    ZoneEnumAtt: {
        ZoneEnumAtt_id: 0,
        ZoneEnumAtt_name: 1,
        ZoneEnumAtt_conn: 2
    },
    // 战斗数据结构属性
    BettleEnumAtt: {
        BettleEnumAtt_StartTime: 0,         //开始时间
        BettleEnumAtt_EndTime: 1,           //结束时间
        BettleEnumAtt_LastTime: 2,          //剩余时间
    },
    //玩家消息数据结构属性
    mailAttrib: {
        MAIL_ATTRIB_ID: 0,                   //消息动态自增ID
        MAIL_ATTRIB_PID: 1,                  //人物的角色ID
        MAIL_ATTRIB_MID: 2,                  //消息静态ID
        MAIL_ATTRIB_BID: 3,                  //宝箱静态ID
        MAIL_ATTRIB_GET_TIME: 4,             //收到时间
        MAIL_ATTRIB_IS_READ: 5,              //消息是否已读
        MAIL_ATTRIB_IS_TOKE: 6,              //附件是否已领
        MAIL_ATTRIB_DYNAMIC_CONTENT: 7,      //消息动态内容
    },
    //卡牌商城属性
    shopCardAttrib: {
        ID: 0,                 //商品动态自增ID
        roundId: 1,            //卡牌解锁大关卡
        CID: 2,                //卡牌ID
        num: 3,                //可购买数
        price: 4,              //基价
        time: 5,               //记录生成时间
    },
    //玩家卡牌商城属性
    pShopCardAttrib: {
        SHOP_ATTRIB_ID: 0,             //商品动态自增ID
        SHOP_ATTRIB_PID: 1,            //人物的角色ID
        SHOP_ATTRIB_CID: 2,            //卡牌ID
        SHOP_ATTRIB_BUY_NUM: 3,        //商品已购买数量
    },
    //玩家宝箱数据结构属性
    boxAttrib: {
        BOX_ATTRIB_ID: 0,                   //动态自增ID
        BOX_ATTRIB_PID: 1,                  //人物的角色ID
        BOX_ATTRIB_BID: 2,                  //宝箱静态ID
        BOX_ATTRIB_POSITION: 3,             //宝箱位
        BOX_ATTRIB_UNLOCKTIME: 4,           //倒计时开启时间
    },
    //玩家成就数据结构属性
    achieveAttrib: {
        ACH_ATTRIB_ID: 0,                   //动态自增ID
        ACH_ATTRIB_PID: 1,                  //人物的角色ID
        ACH_ATTRIB_AID: 2,                  //成就静态ID
    },

    //常量静态表中属性
    constant: {
        mail_vaild_day_id: 6,                    //邮件有效时间（天）
        minuteOfOneDaimond: 8,                   //1个钻石可抵消开宝箱的时间（分钟）
        secondOfDropCard: 9,                     //奇遇关卡卡牌打折时间（秒）
        maxPower: 12,                            //初始体力
        minutesOf1Power: 17,                     //恢复1点体力需要时间（分钟）
        powersPerBuyGet: 18,                     //体力每次购买数量
        diamondsCostsBuyPowersPerTime: 19,       //体力每次购买价格（阶梯价格，达到最大值时，按照最大值计算）
        honourShopNum: 20,//荣誉商店最大商品显示数量
        trailNumPerDay: 21,//试炼谷每日挑战次数
        arenaOpponentsFlushCD: 22,//竞技场对手刷新时间（小时）
        arenaAboveOpponentsMinNum: 23,//竞技场对手等级大于玩家等级的最少数量
        arenaAboveOpponentsMaxNum: 24,//竞技场对手等级高于玩家等级的最大数量
        arenaOpponentsMinLevelGap: 25,//竞技场对手低于玩家等级上限
        arenaOpponentsMaxLevelGap: 26,//竞技场对手高于玩家等级上限
        arenaMaxTickets: 27,//竞技场挑战卷最大数量
        arenaAwardBalanceTimePerDay: 28,//竞技场每日结算时间（时刻）
        arenaAwardBalanceTimePerWeek: 29,//竞技场每周结算时间（时刻）
        arenaShopDiamondsCostsPerFlush: 30,//竞技场商店刷新价格
        trailShopDiamondsCostsPerFlush: 31,//千层塔商店刷新价格
    },
    //卡牌品质
    cardType: {
        Common: 1,                                  //普通卡牌
        Rare: 2,                                    //稀有卡牌
        Epic: 3,                                    //史诗卡牌
        Legendary: 4,                               //传奇卡牌
    },
    //成就类型
    achieveTypeEnume: {
        addBigRound: 1,                                 //章节解锁
        addNormal: 2,                                   //规通关数达到N次
        addLimit: 3,                                    //限时通关数达到N次
        addCardKindNum: 4,                              //收集到N种卡牌
        addCardsNum: 5,                                 //收集到N张卡牌
        addGods: 6,                                     //获得N个金币
        addPlayerLevel: 7,                              //角色达到N级
        costGods: 8,                                   //消耗N个金币

    },
    //记录类型
    logTypeEnume: {
        gmChange: 1,                                    //gm
        achieve: 2,                                     //成就奖励
        box: 3,                                         //宝箱奖励
        boxReduce: 4,                                   //开宝箱消耗
        mail: 5,                                        //邮件奖励
        shopAdd: 6,                                     //商城购买
        shopReduce: 7,                                  //商城购买消耗
        discountShopAdd: 8,                             //打折购买
        discountShopReduce: 9,                          //打折购买消耗
        register: 10,                                   //注册
    },
    //部落
    tribeAtt: {
        onLineNum: 1,
    },
    //竞技场
    arenaAtt: {
        id: 0,//数据库自增id
        pid: 1,
        flushOpponentsNum: 2,
        flushOpponentsTime: 3,
        opponents: 4,
    },
    //竞技场对手列表
    arenaOpponentsAtt: {
        pid: 0,
        nick: 1,
        icon: 2,
        level: 3,
        defensiveVictoryNumber: 4,//防守胜利次数
        state: 5,//战斗记录（0未打，-1负，1胜）
    },
    gameMgrEnume: {
        thisName: 'gameMgr',//静态表数据

    },
    gameConstantDataMgr: {
        thisName: 'gameConstantDataMgr',
        shopCard: 'shopCard',//商城数据
        tribe: 'tribe',
    },
    //设定表
    tableNameEnume: {
        TableTreasuerBoxInfo: 'TableTreasuerBoxInfo',  //宝箱表
        TableCardBaseInfo: 'TableCardBaseInfo',        //卡牌表
        TableAchievement: 'TableAchievement',          //成就表
        TableRound_Small: 'TableRound_Small',          //小关卡表
    },
    redis: {
        playerInfo: {
            pid: 0,
            nick: 1,
            icon: 2,
            level: 3,


        }
    }

};