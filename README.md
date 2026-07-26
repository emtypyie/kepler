# Kepler

**Kepler by Emtypyie** — Make your homeserver better. A local-first service hub that runs ediary, pyieOS, and more on your own machine. No cloud, no tracking, full control.

## Features

- **100% Local** — All data stays on your machine. No cloud, no third parties.
- **One Command Install** — Auto-detects Docker or falls back to standalone executable.
- **Background Service** — Runs on startup, no terminal window needed.
- **Modular Services** — ediary (notes), pyieOS (system dashboard), extensible via plugins.
- **Cross-Platform** — Windows, Linux, macOS.

## Quick Start

```bash
# Linux / macOS
curl -fsSL https://kepler.emtypyie.in/curler | bash

# Windows (PowerShell)
irm https://kepler.emtypyie.in/curler/ps1 | iex
```

This downloads the standalone executable, installs it as a background service (systemd / launchd / scheduled task), and starts it. Open `https://kepler.emtypyie.in` in your browser to create an account.

## Services

| Service | Status | Description |
|---------|--------|-------------|
| **ediary** | Available | Markdown note-taking with full-text search |
| **pyieOS** | Coming Soon | System dashboard: CPU, RAM, disk, services |

## Manual Download

Pre-built executables (no Node.js required):

| Platform | Download |
|----------|----------|
| Windows x64 | [`kepler-backend-v2.0.7-x64.exe`](https://github.com/emtypyie/kepler/releases/latest/download/kepler-backend-v2.0.7-x64.exe) |
| Linux x64 | [`kepler-backend-v2.0.7-x64.AppImage`](https://github.com/emtypyie/kepler/releases/latest/download/kepler-backend-v2.0.7-x64.AppImage) |
| macOS x64 | [`kepler-backend-v2.0.7-macos-x64`](https://github.com/emtypyie/kepler/releases/latest/download/kepler-backend-v2.0.7-macos-x64) |

```bash
# Linux/macOS
chmod +x kepler-backend-*
./kepler-backend-*
```

## Architecture

```
kepler/
├── backend/           # Node.js/Express API (port 41783)
│   ├── core/auth.js   # Shared auth (scrypt, tokens)
│   ├── server.js      # Loads services dynamically
│   └── services/
│       ├── ediary/    # Notes CRUD (/api/notes)
│       └── pyieos/    # System info + services (/api/pyieos)
├── frontend/          # Static HTML/CSS/JS (Vercel)
│   ├── index.html     # Landing page
│   ├── dashboard.html # Service cards
│   ├── diary/         # ediary UI
│   └── pyieos/        # System dashboard
└── setup/             # Auto-start scripts
    ├── windows.ps1    # Scheduled task
    ├── linux.sh       # systemd user service
    └── macos.sh       # launchd agent
```

## Development

```bash
cd backend
npm install
npm start
# API at http://localhost:41783
```

## Auto-Start

The installer registers a service that launches on boot/login:

- **Windows** — Scheduled Task (ONLOGON, hidden)
- **Linux** — `systemctl --user enable --now kepler`
- **macOS** — `launchctl load ~/Library/LaunchAgents/com.emtypyie.kepler.plist`

## Privacy

- Zero telemetry, zero analytics
- Accounts stored locally in `users.json` (scrypt-hashed passwords)
- All API calls stay on your network
- See [Privacy Policy](https://kepler.emtypyie.in/privacy)

## License

MIT — Built by [Emtypyie](https://emtypyie.in) (Subhadeep Das, IIT Madras)

---

**Kepler by Emtypyie** — Make your homeserver better.