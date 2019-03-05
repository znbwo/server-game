var pomelo = require('pomelo');
var schedule = require('pomelo-schedule');
var routeUtil = require('./app/util/routeUtil');
var mysql = require('mysql');
//var gameMgr = require('./app/domain/gameData/gameMgr');
var gameDataMgr = require('./app/domain/gameData/userDataMgr');
var UserLogic = require('./app/domain/logic/userLogic');
var BaseLogic = require('./app/domain/logic/baseLogic');
var CardLogic = require('./app/domain/logic/cardLogic');
var FightLogic = require('./app/domain/logic/fightLogic');
var PublicLogic = require('./app/domain/logic/publicLogic');
var MailsLogic = require('./app/domain/logic/mailsLogic');
var ShopLogic = require('./app/domain/logic/shopLogic');
var BoxLogic = require('./app/domain/logic/boxLogic');
var RankLogic = require('./app/domain/logic/rankLogic');
var AchieveLogic = require('./app/domain/logic/achieveLogic');
var TribeLogic = require('./app/domain/logic/tribeLogic');
var ArenaLogic = require('./app/domain/logic/arenaLogic');
var TableManager = require('./app/domain/tableReader/code/TableManager.js');
var GameConstantData = require('./app/domain/gameData/gameConstantData');

var msgServer = require('./app/domain/sendMsg/msgServer');
var httpPlugin = require('pomelo-http-plugin');
var path = require('path');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'TUI');

var SocketType = 1; // 0 socket.io  1 websocket

// app configure
app.configure('development', function() {
    app.before(pomelo.filters.toobusy());
    // route configures
    app.route( 'game', routeUtil.game );
    // filter configures
    app.filter(pomelo.timeout( 30000 ));

    // 加载sql 配置文件
    app.loadConfig('mysql', app.getBase() + '/config/mysql.json');
    app.loadConfig('redis', app.getBase() + '/config/redis.json');
});

// app configure
/*app.configure('production', function() {
    // route configures
    app.route( 'game', routeUtil.game );
    // filter configures
    app.filter(pomelo.timeout( ));
    // 加载sql 配置文件
    app.loadConfig('mysql', app.getBase() + '/config/mysql.json');
    app.loadConfig('redis', app.getBase() + '/config/redis.json');
});*/

// Configure database
app.configure('production|development', 'game|gate|connector|gamehttp|auth', function() {
    // 创建数据库连接
    var userDbHandle = require('./app/mysql/mysqlUser').init(app);
    var gameDbHandle = require('./app/mysql/mysqlGame').init(app);
    var redisDb = require('./app/redis/redis');
    app.set('userDbHandle', userDbHandle);
    app.set('gameDbHandle', gameDbHandle);
    var redisDbHandle = new redisDb(app);
    app.set('redisDbHandle', redisDbHandle);
    console.log('app.serverType', app.serverType);

    if(app.serverType == 'game'){
        var simpleJob = function () {
            //console.log('begin clear job.');
            app.get('UserLogic').checkUserTime(2);//有效期 分钟
        }
        //var id = schedule.scheduleJob('0/5 * * * * *', simpleJob);
        schedule.scheduleJob({start : Date.now() + 5000, period:5000}, simpleJob, {});
        var simpleJob24 = function () {
            console.log('begin 24.');
            app.get('PublicLogic').update24();
        }
        schedule.scheduleJob('59 59 23 * * *', simpleJob24);

        var simpleJob02 = function () {
            app.get('PublicLogic').update02();//凌晨2点JOB
        }
        schedule.scheduleJob('0 0 2 * * *', simpleJob02);
    }

});

//Configure game server
app.configure('production|development', 'gate|game', function() {

    TableManager().InitGameTable(function(err, res){
        if(!!err){
            console.log('数据读取错误');
            return;
        }
        app.set('gameMgr', res);

        //游戏常量数据
        var gameConstantDataMgr = new GameConstantData(app);
        app.set('gameConstantDataMgr', gameConstantDataMgr.objectData );

        // 加载全局数据管理类
        var gameDataMgrs = new gameDataMgr( app );
        app.set('gameDataMgr', gameDataMgrs );
        // 发送消息到客户端模块
        var msgServers = new msgServer( app );
        app.set('msgServer', msgServers );

        // 用户逻辑处理模块＝＝　用户功能处理
        var userLogics = new UserLogic( app );
        userLogics.addZones();//加载服务器分区列表到gameDataMgr.userMgr.zoneDates
        app.set('UserLogic', userLogics );

        //基地
        var baseLogics = new BaseLogic( app );
        app.set('BaseLogic', baseLogics );

        //卡牌
        var cardLogics = new CardLogic( app );
        app.set('CardLogic', cardLogics );

        //邮件
        var mailsLogic = new MailsLogic( app );
        app.set('MailsLogic', mailsLogic );
        //战斗
        var fightLogic = new FightLogic( app );
        app.set('FightLogic', fightLogic );

        //商城
        var shopLogic = new ShopLogic( app );
        app.set('ShopLogic', shopLogic );

        //排名
        var rankLogic = new RankLogic( app );
        app.set('RankLogic', rankLogic );

        //公共
        var publicLogic = new PublicLogic(app);
        app.set('PublicLogic', publicLogic );

        //宝箱
        var boxLogic = new BoxLogic(app);
        app.set('BoxLogic', boxLogic);

        //成就
        var achieveLogic = new AchieveLogic(app);
        app.set('AchieveLogic', achieveLogic);

        //公会
        var tribeLogic = new TribeLogic(app);
        app.set('TribeLogic', tribeLogic);

        //竞技场ArenaLogic
        var arenaLogic = new ArenaLogic(app);
        app.set('ArenaLogic', arenaLogic);

    });
});
// ============  websocket 需要作心跳设置 否则客户端连接后直接关闭
// app configuration
app.configure('production|development', 'connector', function(){
    if( SocketType <= 0 )
        return;
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 3,
            //disconnectOnTimeout: true,
            useDict : true,
            useProtobuf : true
        });
});

app.configure('production|development', 'gate', function(){
    if( SocketType <= 0 )
        return;
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 3,
            useProtobuf : true
        });
});

app.configure('development', 'gamehttp', function() {
    app.loadConfig('httpConfig', path.join(app.getBase(), 'config/http.json'));
    app.use(httpPlugin, {
        http: app.get('httpConfig')[app.getServerId()]
    });
});
// start app
app.start();
process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
