-- SCHEMA ONLY — run this BEFORE database-dump.sql on an empty database.
-- Generated from local mysqldump --no-data (tables + FKs). No privileged binlog statements.
-- Collations use utf8mb4_unicode_ci (MariaDB-compatible). MySQL 8’s utf8mb4_0900_ai_ci is not supported on MariaDB.
--
-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: 127.0.0.1    Database: languageexchangematchmaker
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `AIChats`
--

DROP TABLE IF EXISTS `AIChats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AIChats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `conversation` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`userId`),
  CONSTRAINT `aichats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Badge`
--

DROP TABLE IF EXISTS `Badge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Badge` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL DEFAULT 0xF09F8F85,
  `category` enum('games','social','learning','streak','level') NOT NULL DEFAULT 'games',
  `tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  `criteriaType` varchar(255) NOT NULL,
  `criteriaValue` int NOT NULL DEFAULT '1',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Challenge`
--

DROP TABLE IF EXISTS `Challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Challenge` (
  `id` int NOT NULL AUTO_INCREMENT,
  `challengerId` int NOT NULL,
  `challengedId` int NOT NULL,
  `gameType` varchar(255) NOT NULL,
  `difficulty` varchar(255) NOT NULL DEFAULT 'Beginner',
  `status` enum('pending','accepted','in_progress','completed','declined','expired') NOT NULL DEFAULT 'pending',
  `challengerScore` int DEFAULT NULL,
  `challengedScore` int DEFAULT NULL,
  `winnerId` int DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `challengerId` (`challengerId`),
  KEY `challengedId` (`challengedId`),
  CONSTRAINT `challenge_ibfk_1` FOREIGN KEY (`challengerId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_ibfk_2` FOREIGN KEY (`challengedId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChatModel`
--

DROP TABLE IF EXISTS `ChatModel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChatModel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `senderId` int NOT NULL,
  `receiverId` int NOT NULL,
  `aiAccessAllowed` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `senderId` (`senderId`),
  KEY `receiverId` (`receiverId`),
  KEY `chat_model_ai_access_allowed` (`aiAccessAllowed`),
  CONSTRAINT `chatmodel_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `useraccount` (`id`),
  CONSTRAINT `chatmodel_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `useraccount` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FriendRequest`
--

DROP TABLE IF EXISTS `FriendRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FriendRequest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requesterId` int NOT NULL,
  `recipientId` int NOT NULL,
  `pairUser1Id` int NOT NULL,
  `pairUser2Id` int NOT NULL,
  `status` enum('pending','accepted','rejected','cancelled','removed') NOT NULL DEFAULT 'pending',
  `respondedAt` datetime DEFAULT NULL,
  `lastActionBy` int DEFAULT NULL,
  `blockedUntil` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `friendrequest_unique_pair` (`pairUser1Id`,`pairUser2Id`),
  KEY `requesterId` (`requesterId`),
  KEY `recipientId` (`recipientId`),
  CONSTRAINT `friendrequest_ibfk_1` FOREIGN KEY (`requesterId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friendrequest_ibfk_2` FOREIGN KEY (`recipientId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FriendsModel`
--

DROP TABLE IF EXISTS `FriendsModel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FriendsModel` (
  `user1_ID` int NOT NULL,
  `user2_ID` int NOT NULL,
  `status` enum('pending','accepted') NOT NULL DEFAULT 'accepted',
  `requester_id` int DEFAULT NULL,
  PRIMARY KEY (`user1_ID`,`user2_ID`),
  KEY `user2_ID` (`user2_ID`),
  CONSTRAINT `friendsmodel_ibfk_1` FOREIGN KEY (`user1_ID`) REFERENCES `UserProfile` (`id`),
  CONSTRAINT `friendsmodel_ibfk_2` FOREIGN KEY (`user2_ID`) REFERENCES `UserProfile` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `GameSession`
--

DROP TABLE IF EXISTS `GameSession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GameSession` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `gameType` varchar(255) NOT NULL,
  `difficulty` varchar(255) NOT NULL DEFAULT 'Beginner',
  `score` int DEFAULT NULL,
  `correct` int DEFAULT NULL,
  `total` int DEFAULT NULL,
  `xpEarned` int NOT NULL DEFAULT '0',
  `status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  `challengeId` int DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `challengeId` (`challengeId`),
  CONSTRAINT `gamesession_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `gamesession_ibfk_2` FOREIGN KEY (`challengeId`) REFERENCES `Challenge` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Interest`
--

DROP TABLE IF EXISTS `Interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Interest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interest_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `interest_name` (`interest_name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MeetingModel`
--

DROP TABLE IF EXISTS `MeetingModel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MeetingModel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `day_of_week` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`),
  CONSTRAINT `meetingmodel_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meetingmodel_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MessageModel`
--

DROP TABLE IF EXISTS `MessageModel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MessageModel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatId` int NOT NULL,
  `senderId` int NOT NULL,
  `text` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chatId` (`chatId`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `messagemodel_ibfk_1` FOREIGN KEY (`chatId`) REFERENCES `ChatModel` (`id`),
  CONSTRAINT `messagemodel_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `useraccount` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PronunciationRatings`
--

DROP TABLE IF EXISTS `PronunciationRatings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PronunciationRatings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `rating` int NOT NULL,
  `time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `pronunciationratings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Quest`
--

DROP TABLE IF EXISTS `Quest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Quest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `type` enum('individual','team') NOT NULL DEFAULT 'individual',
  `gameType` varchar(255) DEFAULT NULL,
  `goal` int NOT NULL DEFAULT '1',
  `xpReward` int NOT NULL DEFAULT '50',
  `resetType` enum('daily','weekly','permanent') NOT NULL DEFAULT 'permanent',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Team`
--

DROP TABLE IF EXISTS `Team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `logo` varchar(255) NOT NULL DEFAULT 'ðŸ†',
  `inviteCode` varchar(8) NOT NULL,
  `totalXP` int NOT NULL DEFAULT '0',
  `ownerID` int NOT NULL,
  `teamImage` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `inviteCode` (`inviteCode`),
  KEY `ownerID` (`ownerID`),
  CONSTRAINT `team_ibfk_1` FOREIGN KEY (`ownerID`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TeamInvite`
--

DROP TABLE IF EXISTS `TeamInvite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TeamInvite` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` int NOT NULL,
  `inviterId` int NOT NULL,
  `inviteeId` int NOT NULL,
  `status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invite` (`teamId`,`inviteeId`),
  KEY `inviterId` (`inviterId`),
  KEY `inviteeId` (`inviteeId`),
  CONSTRAINT `teaminvite_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teaminvite_ibfk_2` FOREIGN KEY (`inviterId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teaminvite_ibfk_3` FOREIGN KEY (`inviteeId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TeamMember`
--

DROP TABLE IF EXISTS `TeamMember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TeamMember` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','member') NOT NULL DEFAULT 'member',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `userId` (`userId`),
  CONSTRAINT `teammember_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teammember_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TeamQuestProgress`
--

DROP TABLE IF EXISTS `TeamQuestProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TeamQuestProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` int NOT NULL,
  `questId` int NOT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `completedAt` datetime DEFAULT NULL,
  `lastResetAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team_quest` (`teamId`,`questId`),
  KEY `questId` (`questId`),
  CONSTRAINT `teamquestprogress_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teamquestprogress_ibfk_2` FOREIGN KEY (`questId`) REFERENCES `Quest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Transcripts`
--

DROP TABLE IF EXISTS `Transcripts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transcripts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(255) NOT NULL,
  `transcript` longtext NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `aiAccess` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TranscriptUsers`
--

DROP TABLE IF EXISTS `TranscriptUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TranscriptUsers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transcriptId` int NOT NULL,
  `userAccountId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_transcript_user` (`transcriptId`,`userAccountId`),
  KEY `transcript_users_transcript_id` (`transcriptId`),
  KEY `transcript_users_user_account_id` (`userAccountId`),
  CONSTRAINT `transcriptusers_ibfk_1` FOREIGN KEY (`transcriptId`) REFERENCES `Transcripts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transcriptusers_ibfk_2` FOREIGN KEY (`userAccountId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `useraccount`
--

DROP TABLE IF EXISTS `useraccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraccount` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `loggedIn` tinyint(1) NOT NULL DEFAULT '0',
  `gameStats` text,
  `xp` int NOT NULL DEFAULT '0',
  `level` int NOT NULL DEFAULT '1',
  `profileImage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserAvailability`
--

DROP TABLE IF EXISTS `UserAvailability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserAvailability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `day_of_week` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `useravailability_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserBadge`
--

DROP TABLE IF EXISTS `UserBadge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserBadge` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `badgeId` int NOT NULL,
  `earnedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_badge_unique` (`userId`,`badgeId`),
  KEY `badgeId` (`badgeId`),
  CONSTRAINT `userbadge_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userbadge_ibfk_2` FOREIGN KEY (`badgeId`) REFERENCES `Badge` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserInterest`
--

DROP TABLE IF EXISTS `UserInterest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserInterest` (
  `user_id` int NOT NULL,
  `interest_id` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`user_id`,`interest_id`),
  KEY `interest_id` (`interest_id`),
  CONSTRAINT `userinterest_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userinterest_ibfk_2` FOREIGN KEY (`interest_id`) REFERENCES `Interest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserProfile`
--

DROP TABLE IF EXISTS `UserProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserProfile` (
  `id` int NOT NULL,
  `native_language` varchar(255) DEFAULT NULL,
  `target_language` varchar(255) DEFAULT NULL,
  `target_language_proficiency` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `profession` varchar(255) NOT NULL,
  `mbti` varchar(255) DEFAULT NULL,
  `visibility` varchar(255) DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `zodiac` varchar(255) DEFAULT NULL,
  `default_time_zone` varchar(255) NOT NULL DEFAULT 'UTC',
  `learning_goal` varchar(255) DEFAULT NULL,
  `communication_style` varchar(255) DEFAULT NULL,
  `commitment_level` int DEFAULT '3',
  PRIMARY KEY (`id`),
  CONSTRAINT `userprofile_ibfk_1` FOREIGN KEY (`id`) REFERENCES `useraccount` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserQuestProgress`
--

DROP TABLE IF EXISTS `UserQuestProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserQuestProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questId` int NOT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `completedAt` datetime DEFAULT NULL,
  `lastResetAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_quest` (`userId`,`questId`),
  KEY `questId` (`questId`),
  CONSTRAINT `userquestprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `useraccount` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userquestprogress_ibfk_2` FOREIGN KEY (`questId`) REFERENCES `Quest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserRatings`
--

DROP TABLE IF EXISTS `UserRatings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserRatings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `rating` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `userratings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `UserProfile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phonenumber` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserTranslations`
--

DROP TABLE IF EXISTS `UserTranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserTranslations` (
  `en` varchar(255) NOT NULL,
  `ko` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-03  3:04:14
