var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
	/*uid = uid.toString();
	console.log('uid type---', typeof (uid));
	var index = Math.abs(crc.crc32(uid)) % connectors.length;
	return connectors[index];*/
	var index = parseInt(uid) % connectors.length;
	return connectors[index];
};

