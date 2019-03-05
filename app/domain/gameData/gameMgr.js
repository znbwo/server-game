// var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver',__filename);
var TableData = require('./tableData');
var fs = require('fs');

// 资源表格的路径
var datapath = "/data/";

var GameMgr = function( app )
{
    this.app = app;
    this.InitUserTable = null;
    this.GuanQiaTable = null;         // 管卡表格
    this.ItemTable = null;            // 道具表格
    this.ItemGroupTable = null;       // 道具组表格
    this.UserUpExpTable = null;       // 玩家经验表格
    this.PowerTable = null;           // 体力表
    this.ZhangJieTable = null;        // 章节表
    this.BuildingTable = null;        // 建筑表
    this.BuildRelationTable = null;   // 建筑关系表
    this.CharacterBasicTable = null;  // 人物基础表
    this.CharacterUpTable = null;     // 人物升级、升星表
    this.CharacterAdvTable = null;    // 人物进阶表
    this.CharacterStarTable = null;   // 人物升星系数
    this.TechnologyTable = null;      // 研究所
    this.PubRecruitTable = null;      // 酒馆招募
    this.PubRecruitLibTable = null;   // 酒馆招募库
    var safe = this;

    // 释放所有表格数据
    this.ReleaseTable = function( )
    {
        this.InitUserTable = null;
        this.GuanQiaTable = null;         // 管卡表格
        this.ItemTable = null;            // 道具表格
        this.ItemGroupTable = null;       // 道具组表格
        this.UserUpExpTable = null;       // 玩家经验表格
        this.PowerTable = null;           // 体力表
        this.ZhangJieTable = null;        // 章节表
        this.BuildingTable = null;        // 建筑表
        this.BuildRelationTable = null;   // 建筑关系表
        this.CharacterBasicTable = null;  // 人物基础表
        this.CharacterUpTable = null;     // 人物升级、升星表
        this.CharacterAdvTable = null;    // 人物进阶表
        this.CharacterStarTable = null;   // 人物升星系数
        this.TechnologyTable = null;      // 研究所
        this.PubRecruitTable = null;      // 酒馆招募
        this.PubRecruitLibTable = null;   // 酒馆招募库
    }
    // 游戏管理类 启动的时候初始化游戏
    this.InitGameTable = function(  )
    {
        logger.info('加载InitUser.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'InitUser.json');
        safe.InitUserTable = new TableData( JSON.parse(data) );
        logger.info('加载InitUser.json 成功!' );

        logger.info('加载WarLevel.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'WarLevel.json');
        safe.GuanQiaTable = new TableData( JSON.parse(data) );
        safe.GuanQiaTable.DataToMap();
        logger.info('加载WarLevel.json 成功!' );

        logger.info('加载item.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'item.json');
        safe.ItemTable = new TableData( JSON.parse(data) );
        safe.ItemTable.DataToMap();
        logger.info('加载item.json 成功!' );

        logger.info('加载itemgroup.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'itemgroup.json');
        safe.ItemGroupTable = new TableData( JSON.parse(data) );
        safe.ItemGroupTable.DataToMap();
        logger.info('加载itemgroup.json 成功!' );

        logger.info('加载PlayerExp.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'PlayerExp.json');
        safe.UserUpExpTable = new TableData( JSON.parse(data) );
        safe.UserUpExpTable.DataToMap();
        logger.info('加载PlayerExp.json 成功!' );

        //logger.info('加载NicknameTable.json 开始!' );
        //// 表格读取
        //var data = fs.readFileSync( app.getBase()+ datapath+'NicknameTable.json');
        //safe.NicknameTable_prefix = new TableData( JSON.parse(data) );
        //safe.NicknameTable_prefix.addRandData(0);
        //logger.info('加载NicknameTable.json 成功!' );
        //
        //logger.info('加载NicknameTable.json 开始!' );
        //// 表格读取
        //var data = fs.readFileSync( app.getBase()+ datapath+'NicknameTable.json');
        //safe.NicknameTable_suffix = new TableData( JSON.parse(data) );
        //safe.NicknameTable_suffix.addRandData(2);
        //logger.info('加载NicknameTable.json 成功!' );

        logger.info('加载power.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'power.json');
        safe.PowerTable = new TableData( JSON.parse(data) );
        safe.PowerTable.DataToMap();
        logger.info('加载power.json 成功!' );

        logger.info('加载ChapterRreward.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'ChapterRreward.json');
        safe.ZhangJieTable = new TableData( JSON.parse(data) );
        safe.ZhangJieTable.DataToMap();
        logger.info('加载ChapterRreward.json 成功!' );

        logger.info('加载building.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'building.json');
        safe.BuildingTable = new TableData( JSON.parse(data) );
        safe.BuildingTable.DataToMap();
        logger.info('加载building.json 成功!' );

        logger.info('加载BuildingRelation.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'BuildingRelation.json');
        safe.BuildRelationTable = new TableData( JSON.parse(data) );
        safe.BuildRelationTable.DataToMap();
        logger.info('加载BuildingRelation.json 成功!' );

        logger.info('加载Role.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'Role.json');
        safe.CharacterBasicTable = new TableData( JSON.parse(data) );
        safe.CharacterBasicTable.DataToMap();
        logger.info('加载Role.json 成功!' );

        logger.info('加载StaticRoleTable.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'StaticRoleTable.json');
        safe.CharacterUpTable = new TableData( JSON.parse(data) );
        logger.info('加载StaticRoleTable.json 成功!' );

        logger.info('加载HeroAdvance.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'HeroAdvance.json');
        safe.CharacterAdvTable = new TableData( JSON.parse(data) );
        logger.info('加载HeroAdvance.json 成功!' );

        logger.info('加载HeroStar.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'HeroStar.json');
        safe.CharacterStarTable = new TableData( JSON.parse(data) );
        logger.info('加载HeroStar.json 成功!' );

        logger.info('加载technology.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'technology.json');
        safe.TechnologyTable = new TableData( JSON.parse(data) );
        safe.TechnologyTable.DataToMap();
        logger.info('加载technology.json 成功!' );

        logger.info('加载Draw.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'Draw.json');
        safe.PubRecruitTable = new TableData( JSON.parse(data) );
        //safe.PubRecruitTable.DataToMap();
        logger.info('加载Draw.json 成功!' );

        logger.info('加载DrawItem.json 开始!' );
        // 表格读取
        var data = fs.readFileSync( app.getBase()+ datapath+'DrawItem.json');
        safe.PubRecruitLibTable = new TableData( JSON.parse(data) );
        //safe.PubRecruitLibTable.DataToMap();
        logger.info('加载DrawItem.json 成功!' );
    }

    // 重新加载所有表格数据
    this.ResetTable = function( )
    {
        // 释放所有表格数据
        this.ReleaseTable( );
        // 新加载所有表格数据
        this.InitGameTable( );
    }

    // 游戏结束的时候调用  用于释放游戏数据
    this.ReleasGame = function()
    {

    }

    this.InitGameTable( );

    // 或者这一天是这一年中的第几周
    this.theWeek = function( data ){
        var totalDays = 0;
        var years = data.getYear()
        if (years < 1000)
            years += 1900
        var days = new Array(12);
        days[0] = 31;
        days[2] = 31;
        days[3] = 30;
        days[4] = 31;
        days[5] = 30;
        days[6] = 31;
        days[7] = 31;
        days[8] = 30;
        days[9] = 31;
        days[10] = 30;
        days[11] = 31;

        // 获得者一年的第一天是周几
        var datatemp = new Date( );
        datatemp.setMonth( 0 );
        datatemp.setDate( 1 );
        var tempday = datatemp.getDay( );
        totalDays = tempday;
        //判断是否为闰年，针对2月的天数进行计算
        if (Math.round(data.getYear() / 4) == data.getYear() / 4) {
            days[1] = 29
        } else {
            days[1] = 28
        }

        if (data.getMonth() == 0) {
            totalDays = totalDays + data.getDate();
        } else {
            var curMonth = data.getMonth();
            for (var count = 1; count <= curMonth; count++) {
                totalDays = totalDays + days[count - 1];
            }
            totalDays = totalDays + data.getDate();
        }
        //得到第几周
        var week = Math.round(totalDays / 7);
        return week;
    }

    // 获得这一天是这一年中的第几天
    this.GetDateOfYeat = function( data ){
        var totalDays = 0;
        var years = data.getYear()
        if (years < 1000)
            years += 1900
        var days = new Array(12);
        days[0] = 31;
        days[2] = 31;
        days[3] = 30;
        days[4] = 31;
        days[5] = 30;
        days[6] = 31;
        days[7] = 31;
        days[8] = 30;
        days[9] = 31;
        days[10] = 30;
        days[11] = 31;

        //判断是否为闰年，针对2月的天数进行计算
        if (Math.round(data.getYear() / 4) == data.getYear() / 4) {
            days[1] = 29
        } else {
            days[1] = 28
        }

        if (data.getMonth() == 0) {
            totalDays = totalDays + data.getDate();
        } else {
            var curMonth = data.getMonth();
            for (var count = 1; count <= curMonth; count++) {
                totalDays = totalDays + days[count - 1];
            }
            totalDays = totalDays + data.getDate();
        }
        //得到第几周
//        var week = Math.round(totalDays / 7);
        return totalDays;
    }

    this.IsNewWeek = function( data ){
        var curtime = new Date();
        var oldday = this.GetDateOfYeat( data );
        var nowday = this.GetDateOfYeat( curtime );
        if( (nowday - oldday) >= 7 )
            return true;

        // 周日为0,但是我们希望周一为新的一周
        var oldtemp = data.getDay( );
        var nowtemp = curtime.getDay( );
        if( oldtemp == 0 )
            oldtemp = 7;
        if( nowtemp == 0 )
            nowtemp = 7;
        if( nowtemp < oldtemp )
            return true;

        return false;
    }

    this.IsNewWeekEx = function( data ){
        var curtime = new Date();
        var oldday = this.theWeek( data );
        var nowday = this.theWeek( curtime );
        if( oldday != nowday  )
            return true;

        return false;
    }

    this.IsNewDay = function( date ){

        var curtime = new Date();
        if( date.getFullYear() != curtime.getFullYear() )
            return true;
        if( date.getMonth() != curtime.getMonth() )
            return true;
        if( date.getDate() != curtime.getDate() )
            return true;

        return false;
    }

    /*this.getDataOfYear = function( date )
    {
        var dayCount = Math.ceil(( date - new Date( date.getFullYear().toString()))/(24*60*60*1000)+1);
        return dayCount;
    }

    this.getYearWeek = function ( date )
    {
        var a=date.getFullYear(),b=date.getMonth() ,c=date.getDate();

        //date1是当前日期
        //date2是当年第一天
        //d是当前日期是今年第多少天
        //用d + 当前年的第一天的周差距的和在除以7就是本年第几周

        var date1 = new Date(a, parseInt(b) - 1, c), date2 = new Date(a, 0, 1),
            d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);

        return Math.ceil(( d + ( ( date2.getDay() + 1) - 1 ) )/7 );
    }*/
}



module.exports = GameMgr;

