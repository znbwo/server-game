var logger = require('pomelo/node_modules/pomelo-logger').getLogger('gameserver',__filename);
var code = require('../gameData/code');

// 连接服务器的 channel name
var CON_CHANNEL_PREFIX = 'CON_';
var msgServer = function( app )
{
    this.app = app;
    // this.channelServer =  this.app.get('channelService');
}

module.exports =msgServer;

msgServer.prototype.getChannelServer = function ( ) {
    return this.app.get('channelService');
};


msgServer.prototype.addtoChannel = function (uid, sid ) {
    var pchannel = this.getChannelbySid( sid );

    return pchannel.add( uid, sid );
};

msgServer.prototype.deltoChannel = function (uid, sid ) {
    var pchannel = this.getChannelbySid( sid );
    return pchannel.leave( uid, sid );
};

msgServer.prototype.getMemeber = function (uid, sid ) {
    var pchannel = this.getChannelbySid( sid );
    return pchannel.getMember( uid );
};

msgServer.prototype.getChannelbySid = function ( sid ) {
    var conname = CON_CHANNEL_PREFIX + sid;
    var pchannel = this.getChannelServer().getChannel( conname, true );
    return pchannel;
};

msgServer.prototype.getChannelbyUid = function ( uid ) {

    var pGameDataMgr = this.app.get('gameDataMgr');
    if( !pGameDataMgr )
        return;
    var pUserdata = pGameDataMgr.userMgr.getUser( uid );
    if( !pUserdata )
        return;
    var sid = pUserdata.getConServerID();
    var pchannel = this.getChannelbySid( sid );
    return pchannel;
};

msgServer.prototype.getRecordbyUid = function ( uid ) {

    var pchannel = this.getChannelbyUid( uid );
    if( !pchannel )
      return;
    return  pchannel.getMember( uid );
};
msgServer.prototype.pushMessageToPlayer = function ( uid, route, msg)
{
    console.log('uid, route, msg', uid, route, msg);
    var record = this.getRecordbyUid( uid );
    console.log('record', record);
    if( !record )
    {
        logger.error( 'pushMessageToPlayer error!');
        return;
    }
    this.getChannelServer().pushMessageByUids( route, msg, [record], errHandler, function(){});
};

function errHandler(err, fails){
    if(!!err){
        logger.error('Push Message error! %j', err.stack);
    }
}

