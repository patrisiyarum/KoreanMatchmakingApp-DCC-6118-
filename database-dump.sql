-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: languageexchangematchmaker
-- ------------------------------------------------------
-- Server version	9.6.0
--
-- IMPORT ORDER (required on empty database):
--   1) Import database-schema.sql first (creates all tables).
--   2) Then import this file (data only).
--   Or import database-import-all-in-one.sql once (schema + data combined).
-- LOCK TABLES and ALTER TABLE DISABLE/ENABLE KEYS lines removed (shared hosting / InnoDB).
-- If you see "Table doesn't exist", the schema step was skipped or failed — use step 1 or the all-in-one file.
-- For login-only data, use database-minimal-login.sql instead.

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
-- Removed SQL_LOG_BIN / GTID_PURGED (require SUPER; fail on shared hosting)

--
-- Dumping data for table `AIChats`
--

INSERT INTO `AIChats` VALUES (1,2,'{\"conversation\":{\"messages\":[{\"role\":\"user\",\"content\":\"hi\"},{\"role\":\"assistant\",\"content\":\"Hello there! Welcome to our language exchange app! I\'m your AI assistant, ready to help you make the most of your language learning journey.\\n\\nHow can I assist you today? Are you looking to:\\n\\n*   **Find a practice partner?**\\n*   **Ask a question about language learning?**\\n*   **Summarize a recent practice session?**\\n*   **Get help with a translation?**\\n\\nJust let me know what you need! 😊\"},{\"role\":\"user\",\"content\":\"hi\"},{\"role\":\"assistant\",\"content\":\"Hello again! It\'s great to see you.\\n\\nAs I mentioned, I\'m here to help you with:\\n\\n*   **Finding a practice partner** (tell me what language you\'re learning and what your native language is!)\\n*   **Answering your language learning questions** (anything from grammar to learning strategies)\\n*   **Summarizing your practice sessions** (if you have notes or a transcript)\\n*   **Assisting with translations** (just paste the text or tell me what you want to translate)\\n\\nWhat\'s on your mind today? Let\'s get started!\"}],\"state\":null,\"pendingData\":{}}}','2026-03-17 19:35:03','2026-03-17 19:35:03');

--
-- Dumping data for table `Badge`
--

INSERT INTO `Badge` VALUES (1,'First Steps','Complete your first game','👣','games','bronze','games_played',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(2,'Getting Started','Complete 5 games','🎮','games','bronze','games_played',5,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(3,'Game Enthusiast','Complete 25 games','🕹️','games','silver','games_played',25,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(4,'Game Master','Complete 100 games','🏆','games','gold','games_played',100,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(5,'Legendary Player','Complete 500 games','👑','games','platinum','games_played',500,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(6,'Vocab Starter','Complete 1 Term Matching game','📖','learning','bronze','term_matching_played',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(7,'Vocab Builder','Complete 10 Term Matching games','📚','learning','silver','term_matching_played',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(8,'Grammar Rookie','Complete 1 Grammar Quiz','✏️','learning','bronze','grammar_quiz_played',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(9,'Grammar Guru','Complete 10 Grammar Quizzes','🎓','learning','silver','grammar_quiz_played',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(10,'Voice Starter','Complete 1 Pronunciation Drill','🎤','learning','bronze','pronunciation_played',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(11,'Pronunciation Pro','Complete 10 Pronunciation Drills','🗣️','learning','silver','pronunciation_played',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(12,'Perfect Round','Score 100% on any game','💯','games','silver','perfect_score',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(13,'Perfectionist','Score 100% on 10 games','⭐','games','gold','perfect_score',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(14,'Level 2','Reach level 2','🌱','level','bronze','level_reached',2,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(15,'Level 5','Reach level 5','🌿','level','bronze','level_reached',5,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(16,'Level 10','Reach level 10','🌳','level','silver','level_reached',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(17,'Level 25','Reach level 25','🔥','level','gold','level_reached',25,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(18,'Level 50','Reach level 50','💎','level','platinum','level_reached',50,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(19,'Social Butterfly','Add your first friend','🦋','social','bronze','friends_count',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(20,'Popular','Have 10 friends','🤝','social','silver','friends_count',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(21,'Quest Beginner','Complete your first quest','📋','learning','bronze','quests_completed',1,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(22,'Quest Hunter','Complete 10 quests','🗺️','learning','silver','quests_completed',10,1,'2026-03-17 17:55:20','2026-03-17 17:55:20'),(23,'Quest Legend','Complete 50 quests','🏅','learning','gold','quests_completed',50,1,'2026-03-17 17:55:20','2026-03-17 17:55:20');

--
-- Dumping data for table `Challenge`
--

INSERT INTO `Challenge` VALUES (1,2,1,'term-matching','Beginner','pending',NULL,NULL,NULL,NULL,'2026-03-19 08:35:21','2026-03-19 08:35:21'),(2,2,7,'term-matching','Beginner','completed',0,33,7,'2026-03-19 08:49:14','2026-03-19 08:41:48','2026-03-19 08:49:14'),(3,7,2,'term-matching','Beginner','accepted',NULL,NULL,NULL,NULL,'2026-03-19 09:42:58','2026-03-19 09:43:07'),(4,7,2,'term-matching','Beginner','accepted',NULL,NULL,NULL,NULL,'2026-03-19 10:04:48','2026-03-19 10:46:21');

--
-- Dumping data for table `ChatModel`
--


--
-- Dumping data for table `FriendRequest`
--

INSERT INTO `FriendRequest` VALUES (9,8,2,2,8,'accepted','2026-03-19 10:31:08',2,NULL,'2026-03-19 06:31:00','2026-03-19 10:31:08');

--
-- Dumping data for table `FriendsModel`
--

INSERT INTO `FriendsModel` VALUES (2,8,'accepted',NULL);

--
-- Dumping data for table `GameSession`
--

INSERT INTO `GameSession` VALUES (1,2,'term-matching','Beginner',0,NULL,6,0,'completed',NULL,'2026-03-17 19:36:12','2026-03-17 19:36:12','2026-03-17 19:36:12'),(2,2,'term-matching','Beginner',0,NULL,6,0,'completed',NULL,'2026-03-17 19:41:39','2026-03-17 19:41:39','2026-03-17 19:41:39'),(3,2,'grammar-quiz','Beginner',20,1,5,10,'completed',NULL,'2026-03-17 19:41:55','2026-03-17 19:41:55','2026-03-17 19:41:55'),(4,2,'pronunciation-drill','Beginner',100,5,5,40,'completed',NULL,'2026-03-17 19:42:04','2026-03-17 19:42:04','2026-03-17 19:42:04'),(5,2,'term-matching','Advanced',0,NULL,6,0,'completed',NULL,'2026-03-17 19:42:42','2026-03-17 19:42:42','2026-03-17 19:42:42'),(15,2,'term-matching','Beginner',0,NULL,6,0,'completed',2,'2026-03-19 08:49:14','2026-03-19 08:49:14','2026-03-19 08:49:14'),(17,2,'grammar-quiz','Beginner',0,NULL,5,0,'completed',NULL,'2026-03-19 09:09:22','2026-03-19 09:09:22','2026-03-19 09:09:22'),(18,2,'term-matching','Beginner',0,NULL,6,0,'completed',NULL,'2026-03-19 09:29:09','2026-03-19 09:29:09','2026-03-19 09:29:09'),(19,2,'grammar-quiz','Beginner',40,2,5,20,'completed',NULL,'2026-03-19 09:29:22','2026-03-19 09:29:22','2026-03-19 09:29:22'),(20,2,'pronunciation-drill','Beginner',100,5,5,40,'completed',NULL,'2026-03-19 09:29:36','2026-03-19 09:29:36','2026-03-19 09:29:36'),(21,2,'pronunciation-drill','Intermediate',100,5,5,40,'completed',NULL,'2026-03-19 09:29:42','2026-03-19 09:29:42','2026-03-19 09:29:42'),(22,2,'grammar-quiz','Beginner',20,1,5,10,'completed',NULL,'2026-03-19 09:34:15','2026-03-19 09:34:15','2026-03-19 09:34:15'),(23,2,'grammar-quiz','Beginner',20,1,5,10,'completed',NULL,'2026-03-19 09:34:26','2026-03-19 09:34:26','2026-03-19 09:34:26'),(26,8,'term-matching','Beginner',33,2,6,17,'completed',NULL,'2026-03-19 10:38:28','2026-03-19 10:38:28','2026-03-19 10:38:28'),(27,8,'grammar-quiz','Beginner',60,3,5,30,'completed',NULL,'2026-03-19 10:38:40','2026-03-19 10:38:40','2026-03-19 10:38:40');

--
-- Dumping data for table `Interest`
--

INSERT INTO `Interest` VALUES (11,'Art/Crafting'),(1,'Books'),(9,'Fishing'),(10,'Fitness'),(7,'Food'),(4,'Hiking'),(8,'Movies/TV'),(2,'Music'),(6,'Politics'),(3,'Sports'),(12,'Travel'),(5,'Video Games');

--
-- Dumping data for table `MeetingModel`
--

INSERT INTO `MeetingModel` VALUES (1,2,6,'Sunday','11:00:00','12:00:00','2026-03-19 08:36:30','2026-03-19 08:36:30'),(3,2,7,'Sunday','10:00:00','11:00:00','2026-03-19 08:53:38','2026-03-19 08:53:38');

--
-- Dumping data for table `MessageModel`
--


--
-- Dumping data for table `PronunciationRatings`
--


--
-- Dumping data for table `Quest`
--

INSERT INTO `Quest` VALUES (1,'get this party started','complete 5 grammar quizzes','team','grammar-quiz',5,50,'permanent',1,'2026-03-19 08:56:16','2026-03-19 08:56:16'),(2,'First Term Match','Complete your first term matching game','individual','term-matching',1,25,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(3,'Grammar Master','Complete 3 grammar quiz games','individual','grammar-quiz',3,75,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(4,'Pronunciation Practice','Complete 2 pronunciation drills','individual','pronunciation-drill',2,50,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(5,'Daily Player','Play any game today','individual',NULL,1,15,'daily',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(6,'Team Term Match','Complete 5 term matching games as a team','team','term-matching',5,100,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(7,'Team Grammar','Complete 3 grammar quizzes as a team','team','grammar-quiz',3,90,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45'),(8,'Team Pronunciation','Complete 2 pronunciation drills as a team','team','pronunciation-drill',2,60,'permanent',1,'2026-03-19 09:13:45','2026-03-19 09:13:45');

--
-- Dumping data for table `SequelizeMeta`
--

INSERT INTO `SequelizeMeta` VALUES ('01create-user.js'),('01create-UserAccount.js'),('02create-chatModel.js'),('02create-UserProfile.js'),('03create-friendsModel.js'),('03create-MessageModel.js'),('03create-UserTranslations.js'),('04create-InterestModel.js'),('04create-UserAvailabilityModel.js'),('04create-UserInterestModel.js'),('04update-UserProfile-InterestsandPersonality.js'),('04update-UserProfile.js'),('05add-ai-privacy-flag-to-chatModel.js'),('05create-AiChatModel.js'),('06add-userId-to-ai-chat.js'),('06remove-ai-chat-user-account-fk.js'),('07addTranscriptStorageTable.js'),('08create-MeetingModel.js'),('08create-UserRatings.js'),('09create-Pronunciations.js'),('10create-Badge.cjs'),('11create-UserBadge.cjs'),('12add-gameStats-to-users.cjs'),('13create-Challenge.cjs'),('14create-GameSession.cjs'),('15add-profile-customization-fields.cjs'),('16create-FriendRequest.cjs'),('1create-user.js'),('1create-UserAccount.js'),('2create-chatModel.js'),('2create-UserProfile.js'),('3create-friendsModel.js'),('3create-MessageModel.js'),('3create-UserTranslations.js'),('4create-InterestModel.js'),('4create-UserAvailabilityModel.js'),('4create-UserInterestModel.js'),('4update-UserProfile-InterestsandPersonality.js'),('4update-UserProfile.js'),('5add-ai-privacy-flag-to-chatModel.js'),('5create-AiChatModel.js'),('6add-userId-to-ai-chat.js'),('6remove-ai-chat-user-account-fk.js'),('7addTranscriptStorageTable.js'),('8create-MeetingModel.js'),('8create-UserRatings.js'),('9create-Pronunciations.js'),('add-friend-request-status.cjs'),('add-xp-level-to-users.cjs');

--
-- Dumping data for table `Team`
--

INSERT INTO `Team` VALUES (4,'dragons','🐉','7ZUPIS',0,2,NULL,'2026-03-19 10:31:28','2026-03-19 10:31:28');

--
-- Dumping data for table `TeamInvite`
--

INSERT INTO `TeamInvite` VALUES (2,4,2,8,'accepted','2026-03-19 10:31:32','2026-03-19 10:31:42');

--
-- Dumping data for table `TeamMember`
--

INSERT INTO `TeamMember` VALUES (6,4,2,'owner','2026-03-19 10:31:28','2026-03-19 10:31:28'),(7,4,8,'member','2026-03-19 10:31:42','2026-03-19 10:31:42');

--
-- Dumping data for table `TeamQuestProgress`
--

INSERT INTO `TeamQuestProgress` VALUES (5,3,1,4,0,NULL,'2026-03-19 09:28:20','2026-03-19 09:28:20','2026-03-19 09:42:33'),(6,3,6,2,0,NULL,'2026-03-19 09:28:20','2026-03-19 09:28:20','2026-03-19 09:34:58'),(7,3,7,3,1,'2026-03-19 09:34:26','2026-03-19 09:28:20','2026-03-19 09:28:20','2026-03-19 09:34:26'),(8,3,8,2,1,'2026-03-19 09:29:42','2026-03-19 09:28:20','2026-03-19 09:28:20','2026-03-19 09:29:42'),(9,4,6,1,0,NULL,'2026-03-19 10:31:31','2026-03-19 10:31:31','2026-03-19 10:38:28'),(10,4,7,1,0,NULL,'2026-03-19 10:31:31','2026-03-19 10:31:31','2026-03-19 10:38:40'),(11,4,1,1,0,NULL,'2026-03-19 10:31:31','2026-03-19 10:31:31','2026-03-19 10:38:40'),(12,4,8,0,0,NULL,'2026-03-19 10:31:31','2026-03-19 10:31:31','2026-03-19 10:31:31');

--
-- Dumping data for table `Transcripts`
--


--
-- Dumping data for table `TranscriptUsers`
--


--
-- Dumping data for table `useraccount`
--

INSERT INTO `useraccount` VALUES (2,'kotokelleran@gmail.com','$2a$10$1hh64.DOopFDdm.Uu4Hxt.yIc.M64CJax8gxqU74A8Oh.wWNwsJvq','Patrisiya','Rumyantseva','2026-03-17 18:41:11','2026-03-19 09:34:26',0,'{\"term_matching_played\":9,\"games_played\":24,\"grammar_quiz_played\":9,\"pronunciation_played\":6,\"perfect_score\":6}',392,1,'/uploads/1773912663533-598898460.jpg'),(8,'rupatya@icloud.com','$2a$10$e5BQn.Q2aazoH43nmJxGQe0GZzCSatjHf8wqtJWwrJVrj3mCezbIS','Koto','Kelleran','2026-03-19 06:14:25','2026-03-19 10:38:40',1,'{\"term_matching_played\":1,\"games_played\":2,\"grammar_quiz_played\":1}',47,1,'/uploads/1773915377104-637891157.jpeg');

--
-- Dumping data for table `UserAvailability`
--

INSERT INTO `UserAvailability` VALUES (48,2,'Monday','12:00:00','13:00:00','2026-03-19 09:31:06','2026-03-19 09:31:06'),(49,2,'Sunday','09:00:00','10:00:00','2026-03-19 09:31:06','2026-03-19 09:31:06'),(50,2,'Sunday','10:00:00','11:00:00','2026-03-19 09:31:06','2026-03-19 09:31:06'),(51,2,'Sunday','13:00:00','14:00:00','2026-03-19 09:31:06','2026-03-19 09:31:06');

--
-- Dumping data for table `UserBadge`
--

INSERT INTO `UserBadge` VALUES (1,2,1,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(2,2,2,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(3,2,6,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(4,2,8,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(5,2,10,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(6,2,12,'2026-03-17 19:30:09','2026-03-17 19:30:09','2026-03-17 19:30:09'),(22,2,19,'2026-03-19 08:49:14','2026-03-19 08:49:14','2026-03-19 08:49:14'),(24,2,21,'2026-03-19 09:29:09','2026-03-19 09:29:09','2026-03-19 09:29:09'),(26,8,1,'2026-03-19 10:38:28','2026-03-19 10:38:28','2026-03-19 10:38:28'),(27,8,6,'2026-03-19 10:38:28','2026-03-19 10:38:28','2026-03-19 10:38:28'),(28,8,19,'2026-03-19 10:38:28','2026-03-19 10:38:28','2026-03-19 10:38:28'),(29,8,21,'2026-03-19 10:38:28','2026-03-19 10:38:28','2026-03-19 10:38:28'),(30,8,8,'2026-03-19 10:38:40','2026-03-19 10:38:40','2026-03-19 10:38:40');

--
-- Dumping data for table `UserInterest`
--

INSERT INTO `UserInterest` VALUES (2,3,'2026-03-19 09:31:06','2026-03-19 09:31:06'),(2,7,'2026-03-19 09:31:06','2026-03-19 09:31:06'),(2,11,'2026-03-19 09:31:06','2026-03-19 09:31:06');

--
-- Dumping data for table `UserProfile`
--

INSERT INTO `UserProfile` VALUES (2,'English','Korean','Beginner',22,'Female','Education','ENTJ','Show',NULL,'2026-03-18 16:40:28','2026-03-19 09:31:06','Aries','America/New_York','Conversational fluency','Mixed',3),(8,'English','Korean','Beginner',22,NULL,'Education',NULL,'Show',NULL,'2026-03-19 06:14:30','2026-03-19 10:16:21',NULL,'UTC',NULL,NULL,3);

--
-- Dumping data for table `UserQuestProgress`
--

INSERT INTO `UserQuestProgress` VALUES (1,2,4,2,1,'2026-03-19 09:29:42','2026-03-19 09:13:49','2026-03-19 09:13:49','2026-03-19 09:29:42'),(2,2,3,3,1,'2026-03-19 09:34:26','2026-03-19 09:13:49','2026-03-19 09:13:49','2026-03-19 09:34:26'),(3,2,2,1,1,'2026-03-19 09:29:09','2026-03-19 09:13:49','2026-03-19 09:13:49','2026-03-19 09:29:09'),(4,2,5,6,1,'2026-03-19 09:29:09','2026-03-19 09:13:49','2026-03-19 09:13:49','2026-03-19 09:34:26'),(13,8,3,1,0,NULL,'2026-03-19 10:16:29','2026-03-19 10:16:29','2026-03-19 10:38:40'),(14,8,2,1,1,'2026-03-19 10:38:28','2026-03-19 10:16:29','2026-03-19 10:16:29','2026-03-19 10:38:28'),(15,8,4,0,0,NULL,'2026-03-19 10:16:29','2026-03-19 10:16:29','2026-03-19 10:16:29'),(16,8,5,2,1,'2026-03-19 10:38:28','2026-03-19 10:16:29','2026-03-19 10:16:29','2026-03-19 10:38:40');

--
-- Dumping data for table `UserRatings`
--


--
-- Dumping data for table `Users`
--


--
-- Dumping data for table `UserTranslations`
--

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-19  7:16:23
