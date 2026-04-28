# DCC 6118 | Language Exchange Matchmaker

# Release Notes
## Version 5.0.0
### Features
* Plesk deployment: Website is fully deployed on GaTech Plesk.
* Complete UI overhaul: Intention is to make the website more inutitive and appealing to navigate on desktop and mobile.
* Gamification features: 3 langauge learning games introduced along with profile progression, 1-on-1 challenge mode, and team battle mode.
* Enhanced profile customization: Can now specify details about prefered learning style, add a profile image, select from a list of interests, commitment level and more!
* Discover system: Altered matchmaking UI to provide potential partners one at a time. Users can choose to send a friend request or skip based on the other user's profile.
* New communication features: Along with video calling friends, users can now send traditional text messages as well as personalized postcards.
* AI Chat changes: Now uses Google Gemini and features starting prompts.
* Website translation tool: Clicking this button translates most text on the site from English to Korean and vice-versa.
### Bug Fixes
* Fixed translator not properly translating inputted text
* Added popup to logout button to prevent accidental logouts
* Profile level and badges now properly update when playing games
* Fixed profile image not displaying on certain pages
### Outstanding Issues
* UI does not display properly on Discover page on certain screen resolutions
* Not all text is properly translated using translation tool (ex. AI Chatbot)
* Unresolved issue with students in Korea being unable to access the website
## Version 4.0.0
### Features
* Users can set their zodiac sign, interests, availabile times, and default time zones upon profile creation. Users can also edit their profile under Set Profile page, where previously selected attributes are preloaded.
* Users can find and filter other users by zodiac, MBTI, interests, and/or availability through the Find Friends Page
* New Scheduler page where users can view their friends and their overlapping availabilities, and schedule or delete meetings.
* Before joining a video call, users can choose to allow or disallow AI from accessing the transcript after the call.
* After video a video call ends, a user can submit a rating for their practice partner and vice versa. An average of all ratings can be fetched through User Ratings.
* During a video call, if recording is started, transcription of practice session is generated and accessible through Transcripts page afterwards.
* AI chat assistant accessible through Chat Assistant page. AI assistant can suggest practice partners based on compatability (shared interests, age difference, gender, language proficiency), summarize practice sessions through transcripts given the session ID, schedule meetings with another user (normalized against time zones) and answer general language learning-releated queries (e.g. help with reading or writing).
* Users can record and submit audio to AI chat assistant for pronunciation practice and will receive both qualitative and quantitative feedback.
* Users can save AI chats, access previous conversations, and continue them.
### Bug Fixes
* Removed instances of deprecated 'friends_list' which used local storage instead of database from retrieval. Replaced with FriendsModel table and appropriate handlers.
* Fixed VideoRoom so that both user video feeds are displayed during video call
* Updated translator page UI to be centered and with format similar to Google Translate
* Moved 'Add to Friends' button on Find Friends page to be more visible; general UI enhancements
### Outstanding Issues
* Cannot submit comments for other user after practice session
* Video calls use **Zoom** invite links (create a meeting in Zoom, then paste the link in Calls). The app cannot create Zoom meetings without Zoom API credentials.
* Free Gemini plan has rate limits, token is also hardcoded.
## Version 3.0.0
### Features
* Users can set their MBTI personality type, available dates and times, and profile visibility.
* Users can now access the Set Profile page from the dashboard, allowing them to update their attributes and preferences after initially setting them.
* Added a Find Friends page where users can view other users who have their profile visibility set to "show."
* Users can sort and filter listed users in the Find Friends page by their name or demographic attribute, such as age or personality type.
* Revamped the matchmaking system to show a compatability score the user has with the other listed users in the Find Friends page.
* Added a Friends List page where users can view and remove their friends.
* Users can add another user to their friends list after a video call or by selecting a user in the Find Friends page.
* Added multiple chat rooms users can join in the video call.
* Added audio and video preferences for the user.
* Added an input box in the video call which formats as a translated transcript of user-inputted text.
* After a video call, users can give a comment to their chat partner, rate them as a study partner, and analyze their proficiency.
### Version 2.0.0 Features
* Logging out and back in.
* Expanded user profile options for language proficiency, hobby, and profession.
* Matched Users can enter a virtual video conference room and communicate.
* Users can mute themselves and hide their video.
* English to Korean translator page.
### Version 1.0.0 Features
* Registering an account and logging in.
* Creating a personalized profile.
* Matching with individuals that match your needs.
* Able to view friends on dashboard page.
* Chatting with friends.
### Bug Fixes
* Made the application clonable from GitHub.
* Updated overall UI.
* Added or fixed back buttons to pages where one was missing or faulty.
* Application no longer crashes after trying to log out and back in.
* Searching for friends in the Find Friends page is now case insensitive.
* Removed previous friends list and its functionality from dashboard.
* Users' friends lists are now represented by a database in MySQL.
* Fixed video display and audio not working during a call.
* Can now test video call with multiple users.
* Post Video Call page now automatically fetches your recent chat partner.
### Known Issues
* Missing AI-enhanced speaking and listening games.
* Back button is not visually consistent in Post Video Call page.
* A blank user occasionally appears in the Friends List after adding a friend from the Post Video Call page.

