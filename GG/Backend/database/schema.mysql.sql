-- Language Exchange Matchmaker — MySQL / MariaDB schema
-- Import in Plesk: create a database in the panel, open phpMyAdmin → Import.
-- If the database already exists and is not named `languageexchangematchmaker`,
-- remove or edit the CREATE DATABASE / USE lines below.
-- Or: mysql -u USER -p DB_NAME < schema.mysql.sql
--
-- After import, set DB_NAME / DB_USER / DB_PASSWORD in Node app environment.
-- The app also runs sequelize.sync({ alter: true }) on startup to align minor drift.
--
-- Charset: utf8mb4 for full Unicode (Korean, emoji).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `languageexchangematchmaker`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `languageexchangematchmaker`;

-- ---------------------------------------------------------------------------
-- Core users
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `useraccount`;
CREATE TABLE `useraccount` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `firstName` VARCHAR(255) DEFAULT NULL,
  `lastName` VARCHAR(255) DEFAULT NULL,
  `loggedIn` TINYINT(1) NOT NULL DEFAULT 0,
  `xp` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `gameStats` TEXT DEFAULT NULL,
  `profileImage` VARCHAR(1024) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `useraccount_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `UserProfile`;
CREATE TABLE `UserProfile` (
  `id` INT NOT NULL,
  `native_language` VARCHAR(255) DEFAULT NULL,
  `target_language` VARCHAR(255) DEFAULT NULL,
  `target_language_proficiency` VARCHAR(255) DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `gender` VARCHAR(255) DEFAULT NULL,
  `profession` VARCHAR(255) DEFAULT NULL,
  `mbti` VARCHAR(255) DEFAULT NULL,
  `zodiac` VARCHAR(255) DEFAULT NULL,
  `default_time_zone` VARCHAR(255) NOT NULL DEFAULT 'UTC',
  `rating` INT DEFAULT NULL,
  `learning_goal` VARCHAR(255) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `communication_style` VARCHAR(255) DEFAULT NULL,
  `commitment_level` INT DEFAULT 3,
  `visibility` VARCHAR(255) DEFAULT NULL,
  `friends_list` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `UserProfile_id_useraccount_fk`
    FOREIGN KEY (`id`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Interests
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `Interest`;
CREATE TABLE `Interest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interest_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Interest_interest_name_unique` (`interest_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `UserInterest`;
CREATE TABLE `UserInterest` (
  `user_id` INT NOT NULL,
  `interest_id` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`user_id`, `interest_id`),
  KEY `UserInterest_interest_id` (`interest_id`),
  CONSTRAINT `UserInterest_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE,
  CONSTRAINT `UserInterest_interest_fk`
    FOREIGN KEY (`interest_id`) REFERENCES `Interest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Availability & meetings
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `UserAvailability`;
CREATE TABLE `UserAvailability` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `day_of_week` VARCHAR(32) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserAvailability_user_id` (`user_id`),
  CONSTRAINT `UserAvailability_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `MeetingModel`;
CREATE TABLE `MeetingModel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user1_id` INT NOT NULL,
  `user2_id` INT NOT NULL,
  `day_of_week` VARCHAR(64) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `meeting_slot_unique` (`user1_id`,`user2_id`,`day_of_week`,`start_time`,`end_time`),
  KEY `MeetingModel_user2` (`user2_id`),
  CONSTRAINT `MeetingModel_user1_fk`
    FOREIGN KEY (`user1_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE,
  CONSTRAINT `MeetingModel_user2_fk`
    FOREIGN KEY (`user2_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Chats & messages (IDs as INT to match UserAccount)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `MessageModel`;
DROP TABLE IF EXISTS `ChatModel`;

CREATE TABLE `ChatModel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `senderId` VARCHAR(255) NOT NULL,
  `receiverId` VARCHAR(255) NOT NULL,
  `aiAccessAllowed` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ChatModel_sender` (`senderId`),
  KEY `ChatModel_receiver` (`receiverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MessageModel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `chatId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `text` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `MessageModel_chatId` (`chatId`),
  KEY `MessageModel_senderId` (`senderId`),
  CONSTRAINT `MessageModel_chat_fk`
    FOREIGN KEY (`chatId`) REFERENCES `ChatModel` (`id`) ON DELETE CASCADE,
  CONSTRAINT `MessageModel_sender_fk`
    FOREIGN KEY (`senderId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Friends (legacy + structured)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `FriendsModel`;
CREATE TABLE `FriendsModel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user1_ID` INT NOT NULL,
  `user2_ID` INT NOT NULL,
  `status` ENUM('pending','accepted') NOT NULL DEFAULT 'accepted',
  `requester_id` INT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FriendsModel_pair` (`user1_ID`,`user2_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `FriendRequest`;
CREATE TABLE `FriendRequest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `requesterId` INT NOT NULL,
  `recipientId` INT NOT NULL,
  `pairUser1Id` INT NOT NULL,
  `pairUser2Id` INT NOT NULL,
  `status` ENUM('pending','accepted','rejected','cancelled','removed') NOT NULL DEFAULT 'pending',
  `respondedAt` DATETIME DEFAULT NULL,
  `lastActionBy` INT DEFAULT NULL,
  `blockedUntil` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FriendRequest_pair` (`pairUser1Id`,`pairUser2Id`),
  KEY `FriendRequest_requester` (`requesterId`),
  KEY `FriendRequest_recipient` (`recipientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Ratings & translations
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `UserRatings`;
CREATE TABLE `UserRatings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserRatings_userId` (`userId`),
  CONSTRAINT `UserRatings_profile_fk`
    FOREIGN KEY (`userId`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `PronunciationRatings`;
CREATE TABLE `PronunciationRatings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `time` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PronunciationRatings_user` (`userId`),
  CONSTRAINT `PronunciationRatings_profile_fk`
    FOREIGN KEY (`userId`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `UserTranslations`;
CREATE TABLE `UserTranslations` (
  `en` VARCHAR(512) NOT NULL,
  `ko` VARCHAR(512) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- AI assistant chats
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `AIChats`;
CREATE TABLE `AIChats` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `conversation` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AIChats_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Transcripts
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `TranscriptUsers`;
DROP TABLE IF EXISTS `Transcripts`;

CREATE TABLE `Transcripts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sessionId` VARCHAR(255) NOT NULL,
  `transcript` TEXT NOT NULL,
  `aiAccess` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Transcripts_sessionId_unique` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TranscriptUsers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `transcriptId` INT NOT NULL,
  `userAccountId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_transcript_user` (`transcriptId`,`userAccountId`),
  KEY `TranscriptUsers_user` (`userAccountId`),
  CONSTRAINT `TranscriptUsers_transcript_fk`
    FOREIGN KEY (`transcriptId`) REFERENCES `Transcripts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `TranscriptUsers_account_fk`
    FOREIGN KEY (`userAccountId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `TeamInvite`;
DROP TABLE IF EXISTS `TeamMember`;
DROP TABLE IF EXISTS `Team`;

CREATE TABLE `Team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(255) NOT NULL DEFAULT '🏆',
  `inviteCode` VARCHAR(8) NOT NULL,
  `totalXP` INT NOT NULL DEFAULT 0,
  `ownerID` INT NOT NULL,
  `teamImage` VARCHAR(1024) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Team_name_unique` (`name`),
  UNIQUE KEY `Team_inviteCode_unique` (`inviteCode`),
  KEY `Team_owner` (`ownerID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TeamMember` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teamId` INT NOT NULL,
  `userId` INT NOT NULL,
  `role` ENUM('owner','member') NOT NULL DEFAULT 'member',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TeamMember_team_user` (`teamId`,`userId`),
  KEY `TeamMember_userId` (`userId`),
  CONSTRAINT `TeamMember_team_fk`
    FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `TeamMember_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TeamInvite` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teamId` INT NOT NULL,
  `inviterId` INT NOT NULL,
  `inviteeId` INT NOT NULL,
  `status` ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TeamInvite_team` (`teamId`),
  KEY `TeamInvite_inviter` (`inviterId`),
  KEY `TeamInvite_invitee` (`inviteeId`),
  CONSTRAINT `TeamInvite_team_fk`
    FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Quests & badges
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `UserQuestProgress`;
DROP TABLE IF EXISTS `TeamQuestProgress`;
DROP TABLE IF EXISTS `UserBadge`;
DROP TABLE IF EXISTS `Quest`;
DROP TABLE IF EXISTS `Badge`;

CREATE TABLE `Quest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(1024) NOT NULL,
  `type` ENUM('individual','team') NOT NULL DEFAULT 'individual',
  `gameType` VARCHAR(255) DEFAULT NULL,
  `goal` INT NOT NULL DEFAULT 1,
  `xpReward` INT NOT NULL DEFAULT 50,
  `resetType` ENUM('daily','weekly','permanent') NOT NULL DEFAULT 'permanent',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserQuestProgress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `questId` INT NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completedAt` DATETIME DEFAULT NULL,
  `lastResetAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UQP_user` (`userId`),
  KEY `UQP_quest` (`questId`),
  CONSTRAINT `UQP_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `UQP_quest_fk`
    FOREIGN KEY (`questId`) REFERENCES `Quest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TeamQuestProgress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teamId` INT NOT NULL,
  `questId` INT NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completedAt` DATETIME DEFAULT NULL,
  `lastResetAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TQP_team` (`teamId`),
  KEY `TQP_quest` (`questId`),
  CONSTRAINT `TQP_team_fk`
    FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `TQP_quest_fk`
    FOREIGN KEY (`questId`) REFERENCES `Quest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Badge` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(1024) NOT NULL,
  `icon` VARCHAR(64) NOT NULL DEFAULT '🏅',
  `category` ENUM('games','social','learning','streak','level') NOT NULL DEFAULT 'games',
  `tier` ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  `criteriaType` VARCHAR(255) NOT NULL,
  `criteriaValue` INT NOT NULL DEFAULT 1,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Badge_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserBadge` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `badgeId` INT NOT NULL,
  `earnedAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserBadge_user_badge` (`userId`,`badgeId`),
  KEY `UserBadge_badge` (`badgeId`),
  CONSTRAINT `UserBadge_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `UserBadge_badge_fk`
    FOREIGN KEY (`badgeId`) REFERENCES `Badge` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Challenges & game sessions
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `GameSession`;
DROP TABLE IF EXISTS `Challenge`;

CREATE TABLE `Challenge` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `challengerId` INT NOT NULL,
  `challengedId` INT NOT NULL,
  `gameType` VARCHAR(255) NOT NULL,
  `difficulty` VARCHAR(255) NOT NULL DEFAULT 'Beginner',
  `status` ENUM('pending','accepted','in_progress','completed','declined','expired') NOT NULL DEFAULT 'pending',
  `challengerScore` INT DEFAULT NULL,
  `challengedScore` INT DEFAULT NULL,
  `winnerId` INT DEFAULT NULL,
  `completedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Challenge_challenger` (`challengerId`),
  KEY `Challenge_challenged` (`challengedId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `GameSession` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `gameType` VARCHAR(255) NOT NULL,
  `difficulty` VARCHAR(255) NOT NULL DEFAULT 'Beginner',
  `score` INT DEFAULT NULL,
  `correct` INT DEFAULT NULL,
  `total` INT DEFAULT NULL,
  `xpEarned` INT NOT NULL DEFAULT 0,
  `status` ENUM('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  `challengeId` INT DEFAULT NULL,
  `completedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `GameSession_user` (`userId`),
  KEY `GameSession_challenge` (`challengeId`),
  CONSTRAINT `GameSession_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GameSession_challenge_fk`
    FOREIGN KEY (`challengeId`) REFERENCES `Challenge` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
