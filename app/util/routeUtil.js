var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.game = function(session, msg, app, cb)
{
	var gamelogicServers = app.getServersByType('game');

	if(!gamelogicServers || gamelogicServers.length === 0)
    {
        cb(new Error('can not find game servers.'));
		return;
	}
	console.log('session uid ' + session.get('uid'));
	var res = dispatcher.dispatch( session.get( 'uid'), gamelogicServers);
	cb(null, res.id);
};