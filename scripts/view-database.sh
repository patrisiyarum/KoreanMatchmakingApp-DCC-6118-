#!/bin/bash
# View all database tables in terminal table format
# Run: ./scripts/view-database.sh   or   bash scripts/view-database.sh

mysql -u root languageexchangematchmaker -e "
SELECT '=== Challenge (1v1 challenges) ===' as '';
SELECT * FROM Challenge;

SELECT '=== useraccount ===' as '';
SELECT id, email, firstName, lastName, xp, level, profileImage FROM useraccount;

SELECT '=== UserProfile ===' as '';
SELECT * FROM UserProfile;

SELECT '=== FriendsModel ===' as '';
SELECT * FROM FriendsModel;

SELECT '=== FriendRequest ===' as '';
SELECT * FROM FriendRequest;

SELECT '=== GameSession ===' as '';
SELECT * FROM GameSession;

SELECT '=== UserBadge ===' as '';
SELECT * FROM UserBadge;

SELECT '=== Badge ===' as '';
SELECT id, name, description, tier FROM Badge;

SELECT '=== Team ===' as '';
SELECT * FROM Team;

SELECT '=== TeamMember ===' as '';
SELECT * FROM TeamMember;

SELECT '=== TeamInvite ===' as '';
SELECT * FROM TeamInvite;

SELECT '=== Quest ===' as '';
SELECT * FROM Quest;

SELECT '=== UserQuestProgress ===' as '';
SELECT * FROM UserQuestProgress;

SELECT '=== TeamQuestProgress ===' as '';
SELECT * FROM TeamQuestProgress;

SELECT '=== UserAvailability ===' as '';
SELECT * FROM UserAvailability;

SELECT '=== UserInterest ===' as '';
SELECT * FROM UserInterest;

SELECT '=== Interest ===' as '';
SELECT * FROM Interest;

SELECT '=== MeetingModel ===' as '';
SELECT * FROM MeetingModel;

SELECT '=== AIChats ===' as '';
SELECT id, userId, createdAt FROM AIChats;

SELECT '=== ChatModel ===' as '';
SELECT * FROM ChatModel;

SELECT '=== MessageModel ===' as '';
SELECT * FROM MessageModel;

SELECT '=== UserRatings ===' as '';
SELECT * FROM UserRatings;

SELECT '=== PronunciationRatings ===' as '';
SELECT * FROM PronunciationRatings;

SELECT '=== Transcripts ===' as '';
SELECT * FROM Transcripts;
"
