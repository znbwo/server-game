--   消息

CREATE DEFINER=`gamedata`@`localhost` PROCEDURE `getPlayerMailsByPid`(IN `IPid` INT)
    NO SQL
    COMMENT '获取玩家消息信息'
BEGIN
   SELECT * FROM player_mails  WHERE PID = IPid;# 用户消息信息
END


CREATE DEFINER=`game_data`@`localhost` PROCEDURE `updatePlayerMails`(IN `iID` INT, IN `iPID` INT, IN `iMID` INT, IN `iBID` INT, IN `iGetTime` INT, IN `iIsRead` TINYINT, IN `iIsToke` TINYINT, IN `iContent` VARCHAR(100))
    NO SQL
    DETERMINISTIC
    COMMENT '更新（返回1）添加（返回0）玩家消息'
BEGIN
	DECLARE ECode int;
   DECLARE OID int;
   SELECT ID INTO OID FROM player_mails WHERE  ID = iID;
   if ( OID > 0 )  then
   		UPDATE player_mails SET PID = iPID, MID = iMID ,BID = iBID , getTime = iGetTime, isRead = iIsRead, isToke = iIsToke, content = iContent WHERE ID = iID;
       set ECode = 1; #更新操作
   else
      INSERT INTO player_mails(`PID`,`MID`,`BID`,`getTime`,`isRead`,`isToke`,`content`)
      VALUES(iPID,iMID,iBID,iGetTime,iIsRead,iIsToke,iContent);
      set ECode = 0;  #添加操作
      set OID = LAST_INSERT_ID();
   end if;
	select ECode,OID;
END

--   商城

CREATE DEFINER=`game_data`@`localhost` PROCEDURE `getPlayerShopByPid`(IN `iPID` INT)
    NO SQL
    COMMENT '查询玩家卡牌商城'
select * from player_shop where PID = iPID