/**
 * Initialize zone
 *
 * @param {Object} opts
 * @api public
 */
var zoneData = function( zid )
{
    this.zid = zid;                        //区id
};

module.exports = zoneData;


zoneData.prototype.setConServerID= function( sid )
{
    return this.conServerID = sid;
};