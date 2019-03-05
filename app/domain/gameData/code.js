module.exports = {
    OK: 200,
    FAIL: 300,

    SERVER: {
        FA_NO_SERVER_AVAILABLE: 500,             //服务器维护中
        FA_DB_ERROR: 501,                        //数据库错误
        FA_CON_BIND_ERROR: 502,                  //网络绑定错误
        FA_NO_ZONE_DATA: 503,                    //没有分区数据
        FA_REQ_PARAMS_ERROR: 504,                //请求参数错误
        FA_NOT_SERVER_DATA: 505,                 //服务器没有数据
        FA_NOT_USER_DATA: 506,                   //服务器没有USER数据
        FA_NOT_PLAYER_DATA: 507,                 //服务器没有PLAYER_R数据
        FA_NOT_TABLE_DATA: 508,                  //服务器没有静态表数据
        FA_CLIENT_ARGS_ERR: 509,                 //客户端参数错误
    },

    USER: {
        FA_USER_BLANK: 601,                      //输入的用户名为空
        FA_PASSWORD_BLANK: 602,                  //输入的密码为空
        FA_PASSWORD_ERROR: 603,                  //密码错误
        FA_USER_NOT_EXIST: 604,                  //用户不存在
        FA_PLAYER_FAIL_EXIST: 605,               //帐户已经有角色  创建失败
        FA_PLAYER_CREATE_OK: 606,                //角色创建成功
        FA_USER_ONLINE: 607,                     //用户在线
        FA_LOGIN_ERROR: 608,                     //登录失败
        FA_USERNAME_REPEAT: 609,                 //用户名重复
        FA_PLAYER_CREATE_OK: 610,                //角色创建成功
        FA_PLAYER_CREATE_FAIL: 611,              //创建角色失败
        FA_UPDATE_NICKNAME_OK: 612,              //修改昵称成功
        FA_UPDATE_ICON_OK: 613,                  //修改头像成功
        FA_MONEY_NOT_ENOUGH: 614,                //金币不足
        FA_DIAMOND_NOT_ENOUGH: 615,              //钻石不足
        FA_MONEYTICKET_NOT_ENOUGH: 616,          //金币关卡入场券不足
        FA_RANDTICKET_NOT_ENOUGH: 617,           //随机关卡入场券不足
        //FA_NICKNAME_REPEAT:618,               //昵称重复
        FA_NICKNAME_ERROR: 619,                  //昵称无效
        FA_NICKNAME_REPEAT: 620,                 //你已经拥有该昵称 昵称重复
        FA_USER_LEVEL_NOT_ENOUGH: 621,           //用户等级过低
        FA_NAME_ERROR: 622,                      //名称无效
        FA_TOKEN_ERROR: 623,                     //token无效
        FA_PWD_ERROR: 624,                       //密码无效
        FA_TOKEN_EXPIRE: 625,                    //token过期
        FA_POWER_FULL: 626,                      //体力已满
        FA_POWER_NOT_TIME_END: 627,              //体力恢复时间未到
    },

    FIGHT: {
        FA_IS_FIGHTING: 701,                     //正在战斗中
        FA_GUANKA_NOT_EXIST: 702,                //关卡不存在
        FA_QZ_GUANKA_FAIL: 703,                  //前置关卡数据为空
        FA_NOT_PASS_GENERAL_GUANKA: 704,         //没能通过该城池所有常规关卡
        FA_BATTLE_LIST_INVALID: 705,             //上阵列表数据无效
        FA_BATTLE_LIST_NOT_MATCH_SERVER: 706,    //上阵数据
        FA_KILLED_LIST_NOT_MATCH_SERVER: 707,    //损耗数据
        FA_NO_REWARD: 708,                       //没有奖励数据
        FA_GUANKA_NO_DATA: 709,                  //没有关卡数据
        FA_MEDAL_NUM_NOT_ENOUGH: 710,            //勋章数不足
        FA_FIGHT_INVALID_ARGS: 711,              //无效参数
        FA_CARD_GROUP_NOT_MATCH: 712,            //上阵卡组不匹配
        FA_TBL_GOLD_GUANKA_NO_DATA: 713,         //金币关卡配表数据不存在
        FA_TBL_RANDCARD_GUANKA_NO_DATA: 714,     //随机关卡配表数据不存在
    },

    BASE: {
        FA_NOT_EXIST: 800,                       //不存在
        FA_TBL_NOT_EXIST: 801,                   //配表里找不到该人物
        FA_BASE_LEVEL_MAX: 802,                  //等级已满不能提升
        FA_TBL_ADD_BASE_EXP_ERROR: 803,          //配表里给基地经验填写错误
    },

    CARD: {
        FA_NOT_EXIST: 900,                       //不存在
        FA_TBL_NOT_EXIST: 901,                  //配表里找不到该人物
        FA_CARD_LEVEL_MAX: 902,                 //等级已满不能提升
        FA_NOT_CHANGE_SAVE_STATUS: 903,         //没有改变保护状态
        FA_CARD_NUM_NOT_ENOUGH: 904,            //卡牌不足
        FA_CARD_HAVE_FIGHT: 905,                //卡牌已经上阵
        FA_GROUP_NOT_EXIST: 906,                //卡组不存在
        FA_CARD_HAVE_IN_GROUP: 907,             //卡牌已存在卡组里
        FA_CARD_HAVE_SAVEING: 908,              //卡牌被保护中
        FA_GROUP_REPEAT: 909,                   //卡组已存在
    },


    BUILD: {
        FA_NOT_HAVE_BID: 1000,                    //没有找到建筑数据
        FA_BUILD_IS_BUSY: 1001,                   //正在升级中
        FA_NOT_FIND_IN_TABLE: 1002,               //招不到数据
        FA_LEVEL_REACH_MAX: 1003,                 //建筑等级达到最大
        FA_BUILD_LEVEL_NOT_ENOUGH: 1004,          //建筑等级太低
        FA_NOT_BE_HIGHTER_USER_LEVEL: 1005,       //主城等级不能高于玩家等级
        FA_BUILD_NOT_UPLEVEL: 1006,               //该建筑没在升级
        FA_TIME_NOT_REACH: 1007,                  //时间未到
        FA_BING_UNLOCKED: 1008,                   //兵种已解锁
        FA_ARRIVE_MAX_CREATE_GROUP: 1009,         //已达到最大生产组数量
        FA_NOT_QUEUE_DATA: 1010,                  //没有建筑生产数据
        FA_NOT_QUICK_OK: 1011,                    //不可提速
        FA_TIME_NOT_ARRIVE: 1012,                 //时间未到
        FA_NUM_OVERFLOW: 1013,                    //数量溢出
        FA_ADD_TECHNOLOGY_REWARD_ERROR: 1014,     //添加科技错误
    },
    //消息（邮件）
    MAILS: {
        FA_NOT_HAVE_MID: 1101,                    //没有找到邮件数据
        FA_OUT_TIME: 1102,                        //邮件已过期
        FA_READ_ALREADY: 1103,                    //附件已读
        FA_TOKE_ALREADY: 1104,                    //附件已领
        FA_NOT_HAVE_ATTACH: 1105,                 //邮件没有附件
        FA_NOT_EXIST_ATTACH: 1106,                //不存在该宝箱id
    },
    //商城
    SHOP: {
        FA_NO_SHOP_TYPE_EXIST: 1201,             //商城类型参数错误
        FA_SHOP_NO_EXIST: 1202,                  //该商品不存在
        FA_SHOP_NO_NUM: 1203,                    //该商品余额不足
        FA_SHOP_NO_TABLE_ERR: 1204,              //卡牌静态表中该商品（卡牌）不存在
        FA_SHOP_NO_enough_Diamond: 1205,         //玩家钻石不足
        FA_SHOP_Client_ARG_ERR: 1206,            //客户端请求参数错误
        FA_SHOP_NO_enough_Gold: 1207,            //玩家金币不足
        FA_SHOP_OUT_TIME: 1208,                  //卡牌打折已失效
    },
    //宝箱
    BOX: {
        FA_BOX_Client_ARG_ERR: 1301,            //客户端请求参数错误
        FA_BOX_NO_EXIST: 1302,                  //该宝箱不存在
        FA_BOX_NO_enough_Diamond: 1303,         //玩家钻石不足
        FA_BOX_CANT_OPEN_AGAIN: 1304,           //宝箱不可重复开启
        FA_BOX_NO_FINISH_COUNT_DOWN: 1305,      //宝箱倒计时未完成
    },
    //成就
    ACHIEVE: {
        FA_ACHIEVE_TOKE_ALREADY: 1401,              //该成就已领
        FA_ACHIEVE_NO_EXIST: 1402,                  //该成就不存在
        FA_ACHIEVE_NO_FINISH: 1403,                 //该成就未完成
        FA_BEFORE_ACHIEVE_NO_FINISH: 1404,          //前置成就未完成
    },
    arena: {
        flushOpponentsHaveCD_ERR: 1501,//刷新对手失败，还在cd中
    },


};
