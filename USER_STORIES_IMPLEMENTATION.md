# User Stories — Implementation Map (Code & Database)

This document maps **User Stories 1–4** from the project spec to concrete **frontend files**, **backend routes/controllers**, and **database tables/migrations** in this repository.

---

## User Story 1 — Find Friends: easier to use & card-based UI

**Story:** As a user, I want the Find Friends experience to be easier to use so I can quickly find partners (visual hierarchy, card layout, sorting/filtering).

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| Discover / filters / cards | `GG/Frontend/src/Components/FriendSearch.js`, `FriendSearch.css` | Card grid with **badge strip** and match context; **accordion “Filters”** (shopping-style sections); **desktop** sidebar + main results (`fs-discover-layout`). Sections: **Personality** (MBTI + zodiac), **Interests**, **Schedule overlap** (deep-link opens schedule via `FILTER_IDX.schedule`), **Study match** (learning goal, communication style, commitment + flex). **Study match** server filters apply **as you change them** (no Apply button); **Clear all** resets filters and refetches. **Search** is **client-side**, as-you-type on the loaded list. **Personality / interests / schedule** narrow the list on the client (`applyClientOnlyFilters` + availability overlap). |
| Sorting | Same — `displayedUsers` | **Best profile match** vs **Name A–Z** is sorted **in the browser** on `matchScore` or name (`localeCompare`). Toggling sort does **not** refetch `discover-users` (see `skipMatchFilterRefetch` / effect deps). Refetch runs when **study match** filters or user id change, not when sort changes. |
| API client | `GG/Frontend/src/Services/findFriendsService.js` | `handleDiscoverUsersApi` → `GET /api/v1/discover-users` with query params (`sort`, `learningGoal`, `communicationStyle`, `commitmentLevel`, `commitmentFlex`, `search`). |
| Profile detail (when viewing a user) | `GG/Frontend/src/Components/ViewProfile.js`, `ViewProfile.css` | Shows languages, goals, badges, availability, etc., in a structured layout. |

### Backend (business logic)

| Area | Location | What it does |
|------|----------|----------------|
| Discover users | `GG/Backend/src/controller/APIController.js` — `getDiscoverUsers` | Filters by visibility, optional **learning goal**, **communication style**, **commitment** (exact or ± flex), **text search**; optional `sort=name` orders by name in SQL, otherwise by **raw match expression** then name. Returns **`matchScore`** (0–100), **`badgeCount`**, **`badgeIcons`**, profile fields including MBTI/zodiac for client filters. |
| Match score | Same — `matchExpr` / `PROFILE_MATCH_MAX_RAW` | Raw score caps at **160**: **40** learning goal match, **40** communication style, up to **25** commitment proximity, **15** MBTI (both set, case-insensitive), **15** zodiac (both set), up to **25** shared **UserInterest** rows (5 pts each). **`matchScore` = round(100 × raw / 160)** clamped to 0–100. If profile columns are missing, falls back to a **legacy** query with `matchScore` 0 (see log + migration `15add-profile-customization-fields.cjs`). |
| Route | `GG/Backend/src/route/api.js` | `GET /discover-users` → `getDiscoverUsers`. |
| Profile validation | `GG/Backend/src/Service/profileValidation.js` — `validateProfileCustomizationFields()` | Shared rules + allowed values from `GG/Backend/config/profile-matching.json`; used from **`userController`** (create/update) and **`getDiscoverUsers`** for filter params. |

### Database

| Table / object | Role |
|----------------|------|
| **`UserProfile`** | `visibility`, `learning_goal`, `communication_style`, `commitment_level`, languages, MBTI, zodiac, etc. Used for discovery filters and match scoring. |
| **`UserAvailability`** | Per-user schedule rows (`day_of_week`, `start_time`, `end_time`); loaded per candidate on the client for **schedule overlap** filtering. |
| **`UserInterest` / `Interest`** | Join table + catalog; used for **client** interest filters and for **shared-interest** points in **`matchScore`** (server subquery in `getDiscoverUsers`). |
| **`useraccount`** | Names, email, `xp`, `level`, `profileImage` surfaced on cards. |

**Note:** Legacy `POST /findFriends` in `friendsController` + `friendsService.handleFindFriends` loads **existing friend rows**, not the public “discover” list. The **Find Friends / Discover** flow uses **`getDiscoverUsers`**.

---

## User Story 2 — AI features grouped for navigation

**Story:** As a user, I want AI features grouped so the app is easier to navigate (dedicated area / helper; unified AI system).

### Frontend

| Area | Location | What it does |
|------|----------|----------------|
| App shell | `GG/Frontend/src/Views/App.js` | Wraps the router in **`AssistantProvider`**; **`Route` `/Assistant`** → full-page **`Assistant`**; renders **`AssistantPanel`** globally (slide-out). |
| Global entry | `GG/Frontend/src/Components/NavBar.js` | **“Ask AI”** toggles the slide-out assistant (`toggleAssistant`). **“Translator”** is separate but adjacent for language help. |
| Panel (sidebar chat) | `GG/Frontend/src/Components/AssistantPanel.js`, `AssistantPanel.css` | Quick prompts, chat history, **Back to prompts** / **Other ways I can help**, link to full assistant. |
| State | `GG/Frontend/src/context/AssistantContext.js` | Open/close, `userId`, `messages`, `clearMessages`, pending summary prompts. |
| Full-page assistant | `GG/Frontend/src/Components/Assistant.js`, `Assistant.css` | Long-form AI chat, history, optional voice, persistence hooks. |
| API wrapper | `GG/Frontend/src/Services/aiAssistantService.js` | `POST /api/v1/ai-assistant/chat`, save/load/clear, conversation history. |

### Backend (unified AI surface)

| Area | Location | What it does |
|------|----------|----------------|
| AI controller / service | `GG/Backend/src/controller/aiAssistantController.js`, `GG/Backend/src/Service/aiAssistantService.js` | HTTP handlers and OpenAI (or equivalent) integration for chat, persistence, history. |
| Routes | `GG/Backend/src/route/api.js` | Under **`/api/v1/ai-assistant/`**: `chat`, `save`, `load`, `clear`, `conversation/:userId`, `history/:userId`. **`POST /ai-assistant/parse/:chatId`** mirrors **`/assistant/parse/:chatId`** (same `assistantController.parseConversation`). |
| Parse helper | `GG/Backend/src/controller/assistantController.js` | Conversation parse endpoint shared with AI routes (see above). |

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
| Home summary | `GG/Frontend/src/Components/Dashboard.js`, `Dashboard.css` | **“Points, games, and challenges”** card: Duolingo-style **level + XP** progress, **challenge record** (wins/losses/draws/win rate/finished), games-related stats. **Home tiles** order: **Profile** (first), **Games & teams**, **Friends**, **Schedule** — each links to the corresponding area. |
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
| `GG/Backend/src/migrations/20add-indexes-gamesession-badge.cjs` | Indexes on **`GameSession`** (`status`, `userId`+`status`, `challengeId`) and **`Badge`** / **`UserBadge`** for faster lookups (named `idx_*`). |
| `GG/Backend/src/migrations/10add-game-session-challenge-badge-indexes.js` | Additional **`GameSession`**, **`Challenge`**, **`UserBadge`** indexes (safe re-run helper). |

**Core tables:** **`useraccount`** (xp, level), **`GameSession`**, **`Challenge`**, **`Badge`**, **`UserBadge`**.

**Verify migrations applied:** check **`SequelizeMeta`** for these filenames; use **`SHOW INDEX`** / Structure → Indexes on the tables above. If **`Badge`** shows many duplicate indexes on **`name`** (`name`, `name_2`, …), only **one** unique index on `name` is needed—extras are safe to remove after backup (operational cleanup, not required for app correctness).

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
| Profile update | `GG/Backend/src/controller/userController.js` | Updates **`UserProfile`** including `learning_goal`, `communication_style`, `commitment_level` with **`validateProfileCustomizationFields`** where applicable. |
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

- **US4** fields on **`UserProfile`** directly feed **US1** **`getDiscoverUsers`** matching, filters, and the **`matchScore`** formula (learning goal, communication style, commitment, MBTI, zodiac).
- **US3** stats (XP, challenges, badges) are shown on **Dashboard** and tie into **`useraccount`**, **`GameSession`**, **`Challenge`**, **`Badge`**, **`UserBadge`**.
- **US2** stays behind **`/api/v1/ai-assistant/*`** and **`AIChats`**, independent of friend discovery but reachable from the same **NavBar** as the rest of the app.

---

## Reference doc

- High-level table → feature mapping: `DATABASE_OVERVIEW.md` at the repo root.
