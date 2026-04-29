# Release Notes

## Version 5.0.0 (current)

### New Features
* **Plesk deployment**: Website is fully deployed on the GaTech Plesk hosting at `https://languagematchmaker.modlangs.gatech.edu`.
* **Complete UI overhaul**: Redesigned for a cleaner, more intuitive experience on both desktop and mobile.
* **Gamification**: Three language-learning games (term matching, grammar quiz, pronunciation drill) with profile XP/levels, badges, 1-on-1 challenge mode, and team battle mode.
* **Bidirectional quiz banks**: Quizzes auto-select the correct question set based on the user's `target_language`. Users learning Korean see Korean prompts; users learning English see English prompts. A "Learning: X" badge surfaces in the quiz UI to confirm which bank loaded.
* **Enhanced profile customization**: Preferred learning style, profile image upload, interests list, commitment level, MBTI, zodiac, age, gender, profession, and time zone.
* **Discover (matchmaking)**: Tinder-style one-at-a-time partner cards with friend-request / skip; cards now scaled down for better screen fit.
* **Communication**: Friend video calls powered by the Agora SDK, text messaging, and personalized postcards.
* **AI Chat assistant**: Powered by Google Gemini with starter prompts and partner-recommendation suggestions.
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
* Users physically located in Korea have reported connectivity issues reaching the Plesk-hosted site.
* Free Google Gemini plan has daily rate limits; the API key is stored server-side in `GG/Backend/.env`.
* Video calls require an Agora project (`AGORA_APP_ID`, optionally `AGORA_APP_CERTIFICATE`) configured in `GG/Backend/.env`.
* Comments cannot yet be submitted for a partner after a practice session.

### Future Improvements (post-handoff)
* **In-call AI assistant** (Dr. Kim's request): an AI tutor that lives inside the Agora video call and can answer questions, offer translations, and prompt practice activities in real time during a session.

---

## Version 4.0.0
### Features
* Users can set zodiac sign, interests, available times, and default time zone at profile creation. Edit Profile preloads previously selected attributes.
* Find Friends page supports filtering by zodiac, MBTI, interests, and availability.
* Scheduler page shows friends' overlapping availabilities and supports creating/deleting meetings.
* Post-call rating system: rate practice partners; an aggregate average is exposed via User Ratings.
* Recorded video calls produce a transcript accessible via the Transcripts page.
* AI Chat Assistant suggests partners by compatibility (interests, age, gender, proficiency), summarizes session transcripts by ID, schedules meetings (time-zone normalized), and answers general language-learning questions.

### Bug Fixes
* Removed deprecated `friends_list` (local-storage based) in favor of the `FriendsModel` DB table.
* VideoRoom now displays both participants' video feeds.
* Translator UI re-centered with a Google-Translate-like layout.
* "Add to Friends" button moved for visibility on Find Friends; general UI polish.

### Outstanding Issues
* Cannot submit comments for the other user after a practice session.
* Video calls relied on a manually pasted invite link at this version; Agora SDK integration arrived in 5.0.0.
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
