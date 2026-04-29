# DCC 6118 — Language Exchange Matchmaker (LangMatch)

LangMatch pairs English and Korean speakers for language practice. Users build a personalized profile, get matched with compatible partners, chat or video call, play language-learning games, and track their progress with XP, levels, and badges.

**Live deployment:** https://languagematchmaker.modlangs.gatech.edu
*(Hosted on the Georgia Tech Plesk; users on the Tech network or VPN have the most reliable access.)*

## Customer Delivery Documents

| Document | Purpose |
|---|---|
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | Current version (5.0.0), features, bug fixes, and known issues — plus prior-release history. |
| [Install_Guide.md](Install_Guide.md) | Prerequisites, dependencies, build, install, run, and troubleshooting for a fresh local setup. |
| [DATABASE_OVERVIEW.md](DATABASE_OVERVIEW.md) | Schema overview for the `languageexchangematchmaker` MySQL database. |
| [DCC-6118_Detailed Design.pdf](DCC-6118_Detailed%20Design.pdf) | Detailed architecture and design document. |

## Repository Layout

```
KoreanMatchmakingApp-DCC-6118-/
├── GG/                        # Active application
│   ├── Backend/               # Express + Sequelize/MySQL API (port 8080)
│   ├── Frontend/              # React + Vite SPA (dev port 5173)
│   └── socket/                # Socket.io chat server (port 8800)
├── database-*.sql             # Schema and import scripts
├── RELEASE_NOTES.md
├── Install_Guide.md
└── README.md                  # this file
```

## Quick Start

```bash
git clone https://github.com/patrisiyarum/KoreanMatchmakingApp-DCC-6118-.git
cd KoreanMatchmakingApp-DCC-6118-
```

Then follow [Install_Guide.md](Install_Guide.md) for the full setup.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, Radix UI
- **Backend:** Node.js + Express, Sequelize ORM, MySQL
- **Realtime:** Socket.io
- **AI:** Google Gemini API (chat assistant + translator)
- **Video:** Agora SDK
- **Hosting:** Plesk (GaTech), Phusion Passenger

## Support

For bug reports or questions, please open an issue on this repository.
