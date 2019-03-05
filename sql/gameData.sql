--   ��Ϣ

CREATE DEFINER=`gamedata`@`localhost` PROCEDURE `getPlayerMailsByPid`(IN `IPid` INT)
    NO SQL
    COMMENT '��ȡ�����Ϣ��Ϣ'
BEGIN
   SELECT * FROM player_mails  WHERE PID = IPid;# �û���Ϣ��Ϣ
END


CREATE DEFINER=`game_data`@`localhost` PROCEDURE `updatePlayerMails`(IN `iID` INT, IN `iPID` INT, IN `iMID` INT, IN `iBID` INT, IN `iGetTime` INT, IN `iIsRead` TINYINT, IN `iIsToke` TINYINT, IN `iContent` VARCHAR(100))
    NO SQL
    DETERMINISTIC
    COMMENT '���£�����1����ӣ�����0�������Ϣ'
BEGIN
	DECLARE ECode int;
   DECLARE OID int;
   SELECT ID INTO OID FROM player_mails WHERE  ID = iID;
   if ( OID > 0 )  then
   		UPDATE player_mails SET PID = iPID, MID = iMID ,BID = iBID , getTime = iGetTime, isRead = iIsRead, isToke = iIsToke, content = iContent WHERE ID = iID;
       set ECode = 1; #���²���
   else
      INSERT INTO player_mails(`PID`,`MID`,`BID`,`getTime`,`isRead`,`isToke`,`content`)
      VALUES(iPID,iMID,iBID,iGetTime,iIsRead,iIsToke,iContent);
      set ECode = 0;  #��Ӳ���
      set OID = LAST_INSERT_ID();
   end if;
	select ECode,OID;
END

--   �̳�

CREATE DEFINER=`game_data`@`localhost` PROCEDURE `getPlayerShopByPid`(IN `iPID` INT)
    NO SQL
    COMMENT '��ѯ��ҿ����̳�'
select * from player_shop where PID = iPID