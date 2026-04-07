-- Fix FKs that point at `UserAccount` when all user rows live in `useraccount`.
-- On Linux/MariaDB (case-sensitive identifiers), `UserAccount` ≠ `useraccount`.
--
-- ERROR #1452 when ADD CONSTRAINT: existing child rows reference user ids that
-- do not exist in `useraccount`. We delete those orphan rows first.
--
-- Run in phpMyAdmin: select DB → Import this file, OR paste into SQL tab.
-- If a DROP FOREIGN KEY fails (name differs), inspect:
--   SELECT CONSTRAINT_NAME, TABLE_NAME FROM information_schema.TABLE_CONSTRAINTS
--   WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 1) Remove orphan rows (FK targets missing in useraccount)
-- ---------------------------------------------------------------------------

DELETE FROM `AIChats` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `AIChats`.`userId`
);

DELETE c FROM `Challenge` c
LEFT JOIN `useraccount` a1 ON c.`challengerId` = a1.`id`
LEFT JOIN `useraccount` a2 ON c.`challengedId` = a2.`id`
WHERE a1.`id` IS NULL OR a2.`id` IS NULL;

DELETE FROM `MessageModel` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `MessageModel`.`senderId`
);

DELETE FROM `ChatModel` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `ChatModel`.`senderId`
) OR NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `ChatModel`.`receiverId`
);

DELETE FROM `FriendRequest` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `FriendRequest`.`requesterId`
) OR NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `FriendRequest`.`recipientId`
);

DELETE FROM `GameSession` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `GameSession`.`userId`
);

DELETE FROM `TranscriptUsers` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `TranscriptUsers`.`userAccountId`
);

DELETE FROM `UserBadge` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `UserBadge`.`userId`
);

DELETE FROM `UserProfile` WHERE NOT EXISTS (
  SELECT 1 FROM `useraccount` u WHERE u.id = `UserProfile`.`id`
);

-- ---------------------------------------------------------------------------
-- 2) Drop old FKs and add FKs referencing `useraccount`
-- ---------------------------------------------------------------------------

ALTER TABLE `AIChats` DROP FOREIGN KEY `aichats_ibfk_1`;
ALTER TABLE `AIChats` ADD CONSTRAINT `aichats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE;

ALTER TABLE `Challenge` DROP FOREIGN KEY `challenge_ibfk_1`;
ALTER TABLE `Challenge` DROP FOREIGN KEY `challenge_ibfk_2`;
ALTER TABLE `Challenge` ADD CONSTRAINT `challenge_ibfk_1` FOREIGN KEY (`challengerId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Challenge` ADD CONSTRAINT `challenge_ibfk_2` FOREIGN KEY (`challengedId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ChatModel` DROP FOREIGN KEY `chatmodel_ibfk_1`;
ALTER TABLE `ChatModel` DROP FOREIGN KEY `chatmodel_ibfk_2`;
ALTER TABLE `ChatModel` ADD CONSTRAINT `chatmodel_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `useraccount` (`id`);
ALTER TABLE `ChatModel` ADD CONSTRAINT `chatmodel_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `useraccount` (`id`);

ALTER TABLE `FriendRequest` DROP FOREIGN KEY `friendrequest_ibfk_1`;
ALTER TABLE `FriendRequest` DROP FOREIGN KEY `friendrequest_ibfk_2`;
ALTER TABLE `FriendRequest` ADD CONSTRAINT `friendrequest_ibfk_1` FOREIGN KEY (`requesterId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FriendRequest` ADD CONSTRAINT `friendrequest_ibfk_2` FOREIGN KEY (`recipientId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `GameSession` DROP FOREIGN KEY `gamesession_ibfk_1`;
ALTER TABLE `GameSession` ADD CONSTRAINT `gamesession_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MessageModel` DROP FOREIGN KEY `messagemodel_ibfk_2`;
ALTER TABLE `MessageModel` ADD CONSTRAINT `messagemodel_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `useraccount` (`id`);

ALTER TABLE `TranscriptUsers` DROP FOREIGN KEY `transcriptusers_ibfk_2`;
ALTER TABLE `TranscriptUsers` ADD CONSTRAINT `transcriptusers_ibfk_2` FOREIGN KEY (`userAccountId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserBadge` DROP FOREIGN KEY `userbadge_ibfk_1`;
ALTER TABLE `UserBadge` ADD CONSTRAINT `userbadge_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserProfile` DROP FOREIGN KEY `userprofile_ibfk_1`;
ALTER TABLE `UserProfile` ADD CONSTRAINT `userprofile_ibfk_1` FOREIGN KEY (`id`) REFERENCES `useraccount` (`id`);

SET FOREIGN_KEY_CHECKS = 1;
