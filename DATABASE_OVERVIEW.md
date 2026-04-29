# Language Exchange Matchmaker - Database Overview

**Database:** MySQL - `languageexchangematchmaker`  
**Generated:** March 19, 2026

---

## Servers Running

| Service | URL | Status |
|---------|-----|--------|
| **Backend** | http://localhost:8080 | ✅ Running |
| **Frontend** | http://localhost:3000 | ✅ Running |

---

## Website Feature → Database Table

| Website Feature | Database Table |
|-----------------|----------------|
| **Login / Register** | useraccount |
| **Profile (Edit Profile, Set Profile)** | useraccount, UserProfile |
| **Find Friends** | UserProfile, UserAvailability, UserInterest, Interest |
| **Friends List** | FriendsModel, FriendRequest |
| **Challenges (1v1)** | **Challenge** |
| **Games (Term Matching, Grammar Quiz, Pronunciation)** | GameSession |
| **Badges / Achievements** | Badge, UserBadge |
| **Quests** | Quest, UserQuestProgress, TeamQuestProgress |
| **Teams** | Team, TeamMember, TeamInvite |
| **Scheduler / Meetings** | MeetingModel, UserAvailability |
| **AI Chat Assistant** | AIChats |
| **Chat with friends** | ChatModel, MessageModel |
| **Video call transcripts** | Transcripts |
| **Post-video ratings** | UserRatings |
| **Pronunciation feedback** | PronunciationRatings |

---

## Database Tables Summary

| Table | Description |
|-------|-------------|
| **Challenge** | 1v1 game challenges (challengerId, challengedId, gameType, status, scores) |
| useraccount | User accounts (email, password, name, XP, level, profileImage) |
| UserProfile | User profiles (language, age, MBTI, zodiac, interests) |
| FriendsModel | Friend connections between users |
| FriendRequest | Pending/accepted friend requests |
| GameSession | Game play history (term-matching, grammar, pronunciation) |
| Badge, UserBadge | Badge definitions + badges earned by users |
| Quest, UserQuestProgress, TeamQuestProgress | Quests and progress |
| Team, TeamMember, TeamInvite | Teams |
| UserAvailability, MeetingModel | Availability + scheduled meetings |
| UserInterest, Interest | User interests |
| AIChats | Saved AI chat conversations |
| ChatModel, MessageModel | Chat rooms and messages |
| UserRatings, PronunciationRatings, Transcripts | Ratings, pronunciation feedback, transcripts |

---

## Sample Data

### useraccount (Users)
| id | email | firstName | lastName | xp | level |
|----|-------|-----------|----------|-----|-------|
| 1 | prumyantseva3@gatech.edu | Patrisiya | Rumyantseva | 9 | 1 |
| 2 | kotokelleran@gmail.com | Patrisiya | Rumyantseva | 272 | 1 |
| 3 | 123 | 1 | 1 | 0 | 1 |
| 4 | kkk1 | Ko | Kelleran | 77 | 1 |
| 5 | 3 | 1 | 2 | 0 | 1 |

### UserProfile (Sample)
| id | native_language | target_language | age | profession | visibility |
|----|-----------------|-----------------|-----|------------|------------|
| 6 | Korean | Korean | 22 | Education | Show |

### FriendsModel (Friend Connections)
| user1_ID | user2_ID | status |
|----------|----------|--------|
| 1 | 2 | accepted |
| 1 | 4 | pending |
| 2 | 4 | pending |
| 3 | 4 | pending |

### Badge (Sample - Game Achievements)
| id | name | description | tier |
|----|------|-------------|------|
| 1 | First Steps | Complete your first game | bronze |
| 2 | Getting Started | Complete 5 games | bronze |
| 3 | Game Enthusiast | Complete 25 games | silver |
| 4 | Game Master | Complete 100 games | gold |
| 5 | Legendary Player | Complete 500 games | platinum |

### GameSession (Sample)
| userId | gameType | difficulty | score | xpEarned | status |
|--------|----------|------------|-------|----------|--------|
| 2 | term-matching | Beginner | 0 | 0 | completed |
| 2 | grammar-quiz | Beginner | 20 | 10 | completed |
| 2 | pronunciation-drill | Beginner | 100 | 40 | completed |

---

## Key Table Schemas

### Challenge (1v1 challenges)
- challengerId, challengedId (user IDs)
- gameType (term-matching, grammar-quiz, pronunciation-drill)
- difficulty (Beginner, Intermediate, Advanced)
- status (pending, accepted, completed, declined)
- challengerScore, challengedScore, winnerId, completedAt

### useraccount
- id, email, password, firstName, lastName
- createdAt, updatedAt, loggedIn
- gameStats (JSON), xp, level

### UserProfile  
- id, native_language, target_language, target_language_proficiency
- age, gender, profession, mbti, zodiac
- visibility, rating, default_time_zone
- learning_goal, communication_style, commitment_level

### FriendsModel
- user1_ID, user2_ID (composite primary key)
- status (pending/accepted), requester_id

---

## Viewing the Database

**Quick reference:**
- **View all data as tables in terminal:** `bash scripts/view-database.sh`
- **MySQL CLI:** `mysql -u root` → `USE languageexchangematchmaker;` → `SHOW TABLES;` → `SELECT * FROM useraccount;` (etc.)
- **GUI (MySQL Workbench / VS Code):** Host: localhost, Port: 3306, User: root, Password: (empty), Database: languageexchangematchmaker

---

### Option 1: MySQL command line
```bash
mysql -u root
```
Then in the MySQL prompt:
```sql
USE languageexchangematchmaker;
SHOW TABLES;
SELECT * FROM UserAccount;
SELECT * FROM UserProfile;
```

### Option 2: Run SQL file
```bash
mysql -u root languageexchangematchmaker -e "SELECT * FROM UserAccount;"
```

### Option 3: MySQL Workbench / GUI client
- **Host:** localhost (127.0.0.1)
- **Port:** 3306
- **User:** root
- **Password:** (leave empty)
- **Database:** languageexchangematchmaker

### Option 4: VS Code
Install the "MySQL" or "Database Client" extension, then add a connection with the same credentials above.

---

## Cleanup Script (Keep Only Patrisiya & Ko Kelleran)

To remove all users except Patrisiya (id 2, with profile pic) and Ko Kelleran (id 4):
```bash
mysql -u root languageexchangematchmaker < scripts/cleanup-users-keep-2-and-4.sql
```
Or run the SQL file from MySQL Workbench.
