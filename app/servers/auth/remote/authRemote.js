var tokenService = require('../../../domain/gameData/token');
var userDb = require('../../../mysql/userDb');
var code = require('../../../domain/gameData/code');
var utils = require('../../../util/utils');

var DEFAULT_SECRET = '75f5e2e4542bee7b61f676d8d';
var DEFAULT_EXPIRE = 6 * 60 * 60 * 1000;	// default session expire time: 6 hours

module.exports = function(app) {
	return new Remote(app);
};

var Remote = function(app) {
	this.app = app;
	//var session = app.get('session') || {};
	this.secret = DEFAULT_SECRET;
	this.expire = DEFAULT_EXPIRE;
};

var pro = Remote.prototype;

/**
 * Auth token and check whether expire.
 *
 * @param  {String}   token token string
 * @param  {Function} cb
 * @return {Void}
 */
pro.auth = function(token, cb) {
	var self = this;
	var res = tokenService.parse(token, this.secret);
	if(!res) {
		cb(null, code.USER.FA_TOKEN_ERROR);
		return;
	}

	if(!checkExpire(res, this.expire)) {
		cb(null, code.USER.FA_TOKEN_EXPIRE);
		return;
	}
	userDb.getUserById(self.app, res.uid, function(err, user) {
		if(err){
			cb(null, code.SERVER.FA_DB_ERROR);
			return;
		}
		cb(null, code.OK, user);
	})
};

/**
 * Check the token whether expire.
 *
 * @param  {Object} token  token info
 * @param  {Number} expire expire time
 * @return {Boolean}        true for not expire and false for expire
 */
var checkExpire = function(token, expire) {
	if(expire < 0) {
		// negative expire means never expire
		return true;
	}

	return (utils.getCurrTime() - token.timestamp) < expire;
};
