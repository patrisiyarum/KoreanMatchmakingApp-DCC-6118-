# Release Notes

## Version 5.0.0 (current)

### New Features
* **Plesk deployment**: Website is fully deployed on the GaTech Plesk hosting at `https://languagematchmaker.modlangs.gatech.edu`.
* **Complete UI overhaul**: Redesigned for a cleaner, more intuitive experience on both desktop and mobile.
* **Gamification**: Three language-learning games (term matching, grammar quiz, pronunciation drill) with profile XP/levels, badges, 1-on-1 challenge mode, and team battle mode.
* **Bidirectional quiz banks**: Quizzes auto-select the correct question set based on the user's `target_language`. Users learning Korean see Korean prompts; users learning English see English prompts. A "Learning: X" badge surfaces in the quiz UI to confirm which bank loaded.
* **Enhanced profile customization**: Preferred learning style, profile image upload, interests list, commitment level, MBTI, zodiac, age, gender, profession, and time zone.
* **Discover (matchmaking)**: Tinder-style one-at-a-time partner cards with friend-request / skip; cards now scaled down for better screen fit.
* **Communication**: Friend video calls (Zoom integration), text messaging, and personalized postcards.
* **AI Chat assistant**: Powered by Google Gemini with starter prompts, partner-recommendation suggestions, audio pronunciation feedback, and saved conversation history.
* **In-site translator**: One-click toggle between English and Korean for most UI strings; standalone translator page powered by Gemini.
* **Scheduler**: View overlapping availability with friends and schedule meetings normalized to time zones.

### Bug Fixes
* Translator now correctly translates user-entered text rather than the placeholder.
* Logout button now shows a confirmation popup to prevent accidental logouts.
* Profile XP, level, and badges update immediately after game results are submitted.
* Profile image now displays consistently across all pages.
* Chat translation only fires when the message language differs from the active site language.

### Known Issues / Outstanding
* Discover page UI can clip on uncommon screen resolutions.
* Some text strings (notably in the AI Chat) are not picked up by the translation tool.
* Users physically located in mainland China / behind certain firewalls have reported connectivity issues with the Plesk host.
* Free Google Gemini plan has daily rate limits; the API key is stored server-side in `GG/Backend/.env`.
* Video calls require a manually created **Zoom** invite link (the app cannot create Zoom meetings without Zoom API credentials).
* Comments cannot yet be submitted for a partner after a practice session.

---

## Version 4.0.0
### Features
* Users can set zodiac sign, interests, available times, and default time zone at profile creation. Edit Profile preloads previously selected attributes.
* Find Friends page supports filtering by zodiac, MBTI, interests, and availability.
* Scheduler page shows friends' overlapping availabilities and supports creating/deleting meetings.
* Pre-call AI consent: choose whether the AI may access the call transcript afterward.
* Post-call rating system: rate practice partners; an aggregate average is exposed via User Ratings.
* Recorded video calls produce a transcript accessible via the Transcripts page.
* AI Chat Assistant suggests partners by compatibility (interests, age, gender, proficiency), summarizes session transcripts by ID, schedules meetings (time-zone normalized), and answers general language-learning questions.
* Audio submissions to the AI assistant return qualitative + quantitative pronunciation feedback.
* AI chat history is saved and resumable.

### Bug Fixes
* Removed deprecated `friends_list` (local-storage based) in favor of the `FriendsModel` DB table.
* VideoRoom now displays both participants' video feeds.
* Translator UI re-centered with a Google-Translate-like layout.
* "Add to Friends" button moved for visibility on Find Friends; general UI polish.

### Outstanding Issues
* Cannot submit comments for the other user after a practice session.
* Video calls use Zoom invite links (manual creation required without Zoom API credentials).
* Free Gemini plan has rate limits; API token was hardcoded at the time.

---

## Version 3.0.0
### Features
* Users can set MBTI, available dates/times, and profile visibility.
* Set Profile page accessible from the dashboard for ongoing edits.
* Find Friends page lists users whose visibility is set to "show."
* Sort/filter Find Friends by name or demographic attribute (age, personality type).
* Matchmaking shows a compatibility score between the viewer and each listed user.
* Friends List page (view + remove).
* Add friends from post-call screen or Find Friends.
* Multiple chat rooms within video calls.
* Audio/video preferences.
* Translated transcript box during video calls.
* Post-call comments, ratings, and proficiency analysis.

---

## Version 2.0.0
### Features
* Logout / re-login flow.
* Expanded profile fields: language proficiency, hobby, profession.
* Matched users can join a virtual video conference room.
* Mute self and hide own video.
* English ↔ Korean translator page.

---

## Version 1.0.0
### Features
* Account registration and login.
* Personalized profile creation.
* Matchmaking by user-stated needs.
* Friends visible on dashboard.
* Friend chat.

### Bug Fixes (cumulative through 1.0.0–3.0.0)
* App now clonable from GitHub.
* Overall UI updates.
* Added/fixed missing or faulty back buttons.
* App no longer crashes on logout-then-login.
* Find Friends search is case-insensitive.
* Removed legacy friends list from dashboard.
* Friends list backed by MySQL.
* Fixed video display and audio failures during calls.
* Multi-user video call testing now works.
* Post-call screen auto-fetches the most recent chat partner.

### Known Issues at 3.0.0
* AI-enhanced speaking and listening games not yet implemented.
* Back button styling inconsistent on Post Video Call.
* A blank user occasionally appeared in the friends list after adding from Post Video Call.
