-- Minimal SQL to get login working (shared hosting / phpMyAdmin friendly).
-- No AI chats, badges, friends, etc.
--
-- BEFORE IMPORT:
--   Select your database (e.g. languageexchangematchmaker) in phpMyAdmin, or uncomment USE below.
--   If the app already created tables (sequelize.sync), you can skip the CREATE TABLE block:
--   run only the DELETE + INSERT section.
--
-- LOGIN AFTER IMPORT:
--   Email:    demo@example.com
--   Password: TempPass123
--
-- Change the password in the app after first login, or edit this file and regenerate a bcrypt hash.

SET NAMES utf8mb4;
/*!40014 SET FOREIGN_KEY_CHECKS=0 */;

-- USE `languageexchangematchmaker`;

CREATE TABLE IF NOT EXISTS `useraccount` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `loggedIn` tinyint(1) NOT NULL DEFAULT 0,
  `gameStats` text,
  `xp` int NOT NULL DEFAULT 0,
  `level` int NOT NULL DEFAULT 1,
  `profileImage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE FROM `useraccount` WHERE `email` = 'demo@example.com';

INSERT INTO `useraccount` (
  `email`,
  `password`,
  `firstName`,
  `lastName`,
  `createdAt`,
  `updatedAt`,
  `loggedIn`,
  `gameStats`,
  `xp`,
  `level`,
  `profileImage`
) VALUES (
  'demo@example.com',
  '$2a$10$adNcqIJyyXdK.y68QmMOjO5rXwCcbrt6mD3T7eDTt9g.z89tdfFPm',
  'Demo',
  'User',
  NOW(),
  NOW(),
  0,
  NULL,
  0,
  1,
  NULL
);

/*!40014 SET FOREIGN_KEY_CHECKS=1 */;
