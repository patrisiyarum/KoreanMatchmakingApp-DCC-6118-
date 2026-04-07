-- Cleanup script: Remove all users EXCEPT:
--   id 2: Patrisiya Rumyantseva (kotokelleran@gmail.com) - has profile pic
--   id 4: Ko Kelleran (kkk1)
--
-- Run with: mysql -u root languageexchangematchmaker < scripts/cleanup-users-keep-2-and-4.sql
-- Or: mysql -u root, then USE languageexchangematchmaker; then paste these commands

SET FOREIGN_KEY_CHECKS = 0;

-- Delete friend connections involving removed users (FriendsModel references UserProfile.id)
DELETE FROM FriendsModel WHERE user1_ID IN (1, 3, 5, 6) OR user2_ID IN (1, 3, 5, 6);

-- Delete friend requests involving removed users
DELETE FROM FriendRequest WHERE requesterId IN (1, 3, 5, 6) OR recipientId IN (1, 3, 5, 6);

-- Delete user availability for removed users
DELETE FROM UserAvailability WHERE user_id IN (1, 3, 5, 6);

-- Delete user interests for removed users (references UserProfile)
DELETE FROM UserInterest WHERE user_id IN (1, 3, 5, 6);

-- Delete user badges for removed users
DELETE FROM UserBadge WHERE userId IN (1, 3, 5, 6);

-- Delete game sessions for removed users
DELETE FROM GameSession WHERE userId IN (1, 3, 5, 6);

-- Delete user quest progress for removed users
DELETE FROM UserQuestProgress WHERE userId IN (1, 3, 5, 6);

-- Delete team-related data for removed users
DELETE FROM TeamInvite WHERE inviterId IN (1, 3, 5, 6) OR inviteeId IN (1, 3, 5, 6);
DELETE FROM TeamMember WHERE userId IN (1, 3, 5, 6);
-- For teams owned by removed users: delete members, invites, then team
DELETE tm FROM TeamMember tm JOIN Team t ON tm.teamId = t.id WHERE t.ownerID IN (1, 3, 5, 6);
DELETE ti FROM TeamInvite ti JOIN Team t ON ti.teamId = t.id WHERE t.ownerID IN (1, 3, 5, 6);
DELETE FROM Team WHERE ownerID IN (1, 3, 5, 6);

-- Delete AI chats for removed users
DELETE FROM AIChats WHERE userId IN (1, 3, 5, 6);

-- Delete user profiles for removed users (must be before UserAccount due to FK)
DELETE FROM UserProfile WHERE id IN (1, 3, 5, 6);

-- Delete user accounts (keep only 2 and 4)
DELETE FROM UserAccount WHERE id IN (1, 3, 5, 6);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify: should show only 2 rows
SELECT id, email, firstName, lastName, profileImage FROM UserAccount;
