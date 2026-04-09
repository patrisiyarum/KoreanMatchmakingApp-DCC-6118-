# User Stories — Implementation Map (Code & Database)

This document maps **User Stories 1–4** from the project spec to concrete **frontend files**, **backend routes/controllers**, and **database tables/migrations** in this repository.

---

## User Story 1 — Find Friends: easier to use & card-based UI

**Story:** As a user, I want the Find Friends experience to be easier to use so I can quickly find partners (visual hierarchy, card layout, sorting/filtering).

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| Discover / filters / cards | `GG/Frontend/src/Components/FriendSearch.js`, `FriendSearch.css` | Card list, search bar, filter tabs (personality, interests, **schedule overlap**, study match), client-side filters, **overlap-based** availability matching, sort controls (best match vs name). |
| API client | `GG/Frontend/src/Services/findFriendsService.js` | `handleDiscoverUsersApi` → `GET /api/v1/discover-users` with query params (`sort`, `learningGoal`, `communicationStyle`, `commitmentLevel`, `commitmentFlex`, `search`). |
| Profile detail (when viewing a user) | `GG/Frontend/src/Components/ViewProfile.js`, `ViewProfile.css` | Shows languages, goals, badges, availability, etc., in a structured layout. |

### Backend (business logic)

| Area | Location | What it does |
|------|----------|----------------|
| Discover users | `GG/Backend/src/controller/APIController.js` — `getDiscoverUsers` | Filters by visibility, optional **learning goal**, **communication style**, **commitment** (exact or ± flex), **text search**; sorts by **affinity score** vs **name**; returns `matchScore`, badge counts/icons. |
| Route | `GG/Backend/src/route/api.js` | `GET /discover-users` → `getDiscoverUsers`. |
| Profile validation | Same file / `userController` | Shared validation for profile customization fields where applicable. |

### Database

| Table / object | Role |
|----------------|------|
| **`UserProfile`** | `visibility`, `learning_goal`, `communication_style`, `commitment_level`, languages, MBTI, zodiac, etc. Used for discovery filters and match scoring. |
| **`UserAvailability`** | Per-user schedule rows (`day_of_week`, `start_time`, `end_time`); loaded per candidate on the client for **schedule overlap** filtering. |
| **`UserInterest` / `Interest`** | Interest tags used for client-side interest filters. |
| **`useraccount`** | Names, email, `xp`, `level`, `profileImage` surfaced on cards. |

**Note:** Legacy `POST /findFriends` in `friendsController` + `friendsService.handleFindFriends` loads **existing friend rows**, not the public “discover” list. The **Find Friends / Discover** flow uses **`getDiscoverUsers`**.

---

## User Story 2 — AI features grouped for navigation

**Story:** As a user, I want AI features grouped so the app is easier to navigate (dedicated area / helper; unified AI system).

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| Global entry | `GG/Frontend/src/Components/NavBar.js` | **“Ask AI”** toggles the slide-out assistant (`toggleAssistant`). **“Translator”** is separate but adjacent for language help. |
| Panel (sidebar chat) | `GG/Frontend/src/Components/AssistantPanel.js`, `AssistantPanel.css` | Quick prompts, chat history, **Back to prompts** / **Other ways I can help**, link to full assistant. |
| State | `GG/Frontend/src/context/AssistantContext.js` | Open/close, `userId`, `messages`, `clearMessages`, pending summary prompts. |
| Full-page assistant | `GG/Frontend/src/Components/Assistant.js`, `Assistant.css` | Long-form AI chat, history, optional voice, persistence hooks. |
| API wrapper | `GG/Frontend/src/Services/aiAssistantService.js` | `POST /api/v1/ai-assistant/chat`, save/load/clear, conversation history. |

### Backend (unified AI surface)

| Area | Location | What it does |
|------|----------|----------------|
| Controller | `GG/Backend/src/controller/aiAssistantController.js` | Handles chat, save/load conversation, list chats, etc. |
| Routes | `GG/Backend/src/route/api.js` | Under **`/api/v1/ai-assistant/`**: `chat`, `save`, `load`, `clear`, `conversation/:userId`, `history/:userId`. |

### Database

| Table | Role |
|-------|------|
| **`AIChats`** | Stores AI conversations (e.g. `userId`, `conversation` JSON); see migrations `05create-AiChatModel.js`, `06add-userId-to-ai-chat.js`. |

---

## User Story 3 — Points, badges, and challenge stats visible (integrated progress)

**Story:** As a user, I want points, badges, and challenge stats clearly visible so progress feels integrated.

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| Home summary | `GG/Frontend/src/Components/Dashboard.js`, `Dashboard.css` | **“Points, games, and challenges”** card: level, XP bar, **challenge record** (wins/losses/draws/win rate/finished), optional game activity & **badges**. |
| Services | `GG/Frontend/src/Services/challengeService.js` (`getChallengeStats`, etc.), `badgeService.js` (`handleGetUserBadgesApi`), `gameSelectionService` / `dashboardService` for XP/level | Feed the dashboard and profile-related views. |
| Profile view | `GG/Frontend/src/Components/ViewProfile.js` | Shows languages, learning style, badges section, etc. |
| Challenge hub | `GG/Frontend/src/Components/ChallengeHub.js` | Deeper challenge UI using the same stats services. |

### Backend

| Area | Location | What it does |
|------|----------|----------------|
| Challenge / game APIs | `GG/Backend/src/route/` + controllers (e.g. `questRoutes`, challenge-related handlers) | Challenge stats and game session data used by services above. |

### Database & performance (indexes)

| Migration | Purpose |
|-----------|---------|
| `GG/Backend/src/migrations/20add-indexes-gamesession-badge.cjs` | Indexes on **`GameSession`** (`status`, `userId`+`status`, `challengeId`) and **`Badge`** / **`UserBadge`** for faster lookups. |
| Earlier related | `10add-game-session-challenge-badge-indexes.js` (if present in repo) | Additional indexing history. |

**Core tables:** **`useraccount`** (xp, level), **`GameSession`**, **`Challenge`**, **`Badge`**, **`UserBadge`**.

---

## User Story 4 — Profile customization (learning goal, communication style, commitment)

**Story:** As a user, I want to customize my profile with learning goals, communication style, and commitment so matches are more meaningful.

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| Edit profile | `GG/Frontend/src/Components/UpdateProfile.js`, `UpdateProfile.css` | Form fields, save flows, integrated XP/challenge summary sections as designed. |
| Options list | `handleGetProfileCustomizationOptionsApi` (via `findFriendsService.js`) | Populates allowed values for goals/styles. |
| Display | `ViewProfile.js` | Read-only display of the same fields. |
| Discover filters | `FriendSearch.js` | “Study match” filters use the same dimensions server-side. |

### Backend

| Area | Location | What it does |
|------|----------|----------------|
| Profile update | `GG/Backend/src/controller/userController.js` (and related profile handlers) | Updates **`UserProfile`** including `learning_goal`, `communication_style`, `commitment_level` with validation. |
| Public profile API | `APIController.getUserProfile` / `updateRating` etc. | Serves profile payloads to the app. |
| Customization options | `getProfileCustomizationOptions` (exposed via API) | Supplies selectable lists for the frontend. |

### Profile validation — rules (shared module)

| Topic | Location | What it enforces |
|-------|----------|------------------|
| **Profile validation** | `GG/Backend/src/Service/profileValidation.js` — `validateProfileCustomizationFields()` | Shared validation for **`learning_goal`**, **`communication_style`**, and **`commitment_level`**. Used on **profile create** (`handleProfileCreation` with `{ requireAll: true }`), **profile update** (`handleProfileUpdate`), and **discover filters** (`APIController.getDiscoverUsers` when any of those filters are present). |
| **Allowed values (lists + numeric range)** | `GG/Backend/config/profile-matching.json` (loaded by `profileValidation.js`) | **`learning_goal`** must be **exactly one** of the strings in `learningGoals` (e.g. *Conversational fluency*, *Cultural appreciation*, …). **`communication_style`** must be **exactly one** of `communicationStyles` (e.g. *Text-heavy*, *Mixed*, …). **`commitment_level`** must be an **integer** between **`commitmentLevel.min`** and **`commitmentLevel.max`** (currently **1–5**; default **3** for normalization helpers). |
| **Create vs update behavior** | Same `validateProfileCustomizationFields` | **Create (`requireAll: true`):** all three fields are **required** (non-empty `learning_goal` / `communication_style`, and `commitment_level` present). **Update / discover filters:** empty strings mean “omit”; if a field **is** sent, it must still match allowed lists / integer range. |
| **Invalid values** | Controllers above | Returns **400** with `validationErrors` array (messages such as *learning_goal must be one of the allowed values*, *commitment_level must be between 1 and 5*, etc.). |
| **Discover-only** | `GG/Backend/src/controller/APIController.js` — `getDiscoverUsers` | Optional query filters `learningGoal`, `communicationStyle`, `commitmentLevel` are validated with the **same** function before building SQL. `commitmentFlex` is clamped to **0–2** for “near my commitment” matching. |

### Database

| Migration | Change |
|-----------|--------|
| `GG/Backend/src/migrations/15add-profile-customization-fields.cjs` | Adds **`UserProfile.learning_goal`**, **`UserProfile.communication_style`**, **`UserProfile.commitment_level`** (integer; stars 1–5 in the UI). |

**Model:** `GG/Backend/src/models/UserProfile.js` defines these fields for Sequelize.

---

## Cross-story relationships

- **US4** fields on **`UserProfile`** directly feed **US1** **`getDiscoverUsers`** matching and filters.
- **US3** stats (XP, challenges, badges) are shown on **Dashboard** and tie into **`useraccount`**, **`GameSession`**, **`Challenge`**, **`Badge`**, **`UserBadge`**.
- **US2** stays behind **`/api/v1/ai-assistant/*`** and **`AIChats`**, independent of friend discovery but reachable from the same **NavBar** as the rest of the app.

---

## Reference doc

- High-level table → feature mapping: `DATABASE_OVERVIEW.md` at the repo root.
