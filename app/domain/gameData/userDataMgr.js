
//var RankMgr = require('../GameData/rankMgr');
var userDb = require('../../mysql/userDb');
var userDataMgr = function (app) {
    this.app = app;
    this.userDatas = {};
    this.userDataNum = 0;
    this.zoneDates = [];
    //this._RankMgr = new RankMgr(app);

    /*this.getRankMgr = function()
    {
        return this._RankMgr;
    };*/
    /**
     * Add Player to area
     * @param {Object} e Entity to add to the area.
     */
    this.addUser = function (pUserData) {
        if (!pUserData || !pUserData.uid) {
            return false;
        }

        if (!!this.userDatas[pUserData.uid]) {
            //logger.error('add player twice! player : %d', player.Uid);
            return false;
        }

        this.userDatas[pUserData.uid] = pUserData;
        this.userDataNum = this.userDataNum + 1;

        /*if( false == this._RankMgr.isLoad() ){
            this._RankMgr.LoadRandList();
        }*/
        return true;
    };
    /**
     * Remove Player form PlayerMgr
     * @param {Number} Uid The Players to remove
     * @return {boolean} remove result
     */
    this.removeUser = function (Uid) {
        var pUserData = this.userDatas[Uid];

        if (!pUserData)
            return false;

        delete this.userDatas[Uid];
        this.userDataNum = this.userDataNum - 1;

        return true;
    };

    /**
     * getPlayer from PlayerMgr
     * @param {Number} uid.
     */
    this.getUser = function (uid) {
        var pUserData = this.userDatas[uid];
        if (!pUserData) {
            return null;
        }
        return pUserData;
    };

    this.isEmpty = function () {
        return this.userDataNum === 0;
    };
}

var gameDataMgr = function( app )
{
    this.app = app;
    this.userMgr = new userDataMgr(app);
}

module.exports = gameDataMgr;