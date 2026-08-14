# 🎮 TetriNET

A modern, web-based multiplayer Tetris game inspired by the classic **TetriNET**. Play against up to 5 opponents in real-time, collect special blocks, and use devastating powers to sabotage your rivals — or help yourself survive.

Built with vanilla JavaScript on the client and a Node.js/TypeScript server using Socket.IO for real-time communication.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)

---

## 🌐 Play Online

You can play live from time to time on: **[http://home.gameandme.fr:3001](http://home.gameandme.fr:3001)**

---

## ✨ Features

- **Multiplayer** — Up to 6 players per room with real-time board synchronization
- **Teams** — Solo play or team-based match options
- **Special Blocks** — Collect and use 9 unique power-ups, color-coded by type:
  - 🟢 **Positive** (green): Clear Line, Random Clear, Clear Specials, Gravity
  - 🔴 **Negative** (red): Add Line, Nuke, Block Bomb, Quake
  - 🟡 **Neutral** (gold): Switch Field
- **Internationalization (i18n)** — Built-in multi-language support (English & French) with automatic browser detection
- **Audio & Sound System** — Sound effects and background music with customizable volume sliders
- **Interactive Help Modal** — Quick in-game reference for special block abilities
- **Lobby System** — Create or join rooms, see available games at a glance
- **In-game Chat & Notifications** — Communicate with other players during the game with toast alerts
- **Classic Controls** — Arrow keys for movement, number keys (1-6) to target players with specials
- **Ghost Piece** — See where your piece will land
- **Garbage Lines** — Clear multiple lines to send garbage to opponents
- **Lock Delay** — Grace period for last-second moves before a piece locks
- **Neon Aesthetic** — Cyberpunk-inspired glassmorphism UI with glowing effects

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) **v18** or higher
- [npm](https://www.npmjs.com/) (included with Node.js)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/ynizon/tetrinet.git
cd tetrinet
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Build the TypeScript server

```bash
npm run build
```

### 4. Start the server

```bash
npm start
```

The game will be available locally at **http://localhost:3000**.

### Development mode (auto-reload)

For development with automatic restarts on file changes:

```bash
npm run dev
```

### 🐳 Docker deployment

The easiest way to deploy TetriNET in production.

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

```bash
# Build and start (accessible on http://localhost)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

To use a custom port (e.g. 3001 or 8080):

```bash
PORT=3001 docker compose up -d --build
```

---

## 🎮 How to Play

### Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left / right |
| ↓ | Soft drop |
| ↑ | Rotate piece |
| Space | Hard drop (instant) |
| 1 | Use special on **yourself** |
| 2-6 | Use special on **opponent** (by slot) |

### Special Blocks

Special blocks appear on the board as lettered cells. Clear the line containing them to collect the special into your queue (max 5). Press a number key to use the first special in your queue on the corresponding target.

| Letter | Special | Type | Effect |
|--------|---------|------|--------|
| **A** | Add Line | 🔴 Negative | Adds a garbage line to the target |
| **C** | Clear Line | 🟢 Positive | Clears the bottom line |
| **N** | Nuke | 🔴 Negative | Nukes the target's entire board |
| **R** | Random Clear | 🟢 Positive | Randomly clears blocks |
| **S** | Switch Field | 🟡 Neutral | Swaps your board with the target's |
| **B** | Clear Specials | 🟢 Positive | Removes all special blocks from the board |
| **O** | Block Bomb | 🔴 Negative | Explodes blocks around special cells |
| **Q** | Quake | 🔴 Negative | Shifts each line randomly left or right |
| **G** | Gravity | 🟢 Positive | Pulls all floating blocks down |

### Scoring

Lines cleared earn points based on the current level:

| Lines | Base Points |
|-------|-------------|
| 1 | 40 |
| 2 | 100 |
| 3 | 300 |
| 4 (Tetris!) | 1,200 |

Points are multiplied by `(level + 1)`. Clear 2+ lines at once to send garbage to all living opponents.

---

## 🏗️ Project Structure

```
tetrinet/
├── client/                  # Frontend (vanilla JS)
│   ├── assets/              # Audio & visual assets
│   ├── css/
│   │   └── style.css        # Neon/glassmorphism styles
│   ├── js/
│   │   ├── config.js        # Game constants & special definitions
│   │   ├── GameManager.js   # Core game loop & logic
│   │   ├── Renderer.js      # Canvas rendering
│   │   ├── SocketClient.js  # Socket.IO client wrapper
│   │   ├── SoundManager.js  # Audio player & SFX/music controls
│   │   ├── TetrisEngine.js  # Board operations & piece mechanics
│   │   ├── UI.js            # DOM manipulation & screen management
│   │   └── main.js          # App entry point & event wiring
│   ├── lang/                # Internationalization
│   │   ├── en.js            # English translations
│   │   ├── fr.js            # French translations
│   │   └── i18n.js          # Translation manager
│   └── index.html           # Single-page app shell
│
├── server/                  # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts         # Express + Socket.IO server entry
│   │   ├── GameRoom.ts      # Room management & game logic
│   │   ├── Player.ts        # Player state & board tracking
│   │   ├── TetrisEngine.ts  # Server-side board operations
│   │   └── types.ts         # Shared TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
└── LICENSE                  # MIT License
```

---

## 🔧 Configuration

Game constants can be adjusted in [`client/js/config.js`](client/js/config.js):

| Setting | Default | Description |
|---------|---------|-------------|
| `BOARD_WIDTH` | 12 | Board width in cells |
| `BOARD_HEIGHT` | 22 | Board height in cells |
| `MAX_SPECIALS` | 5 | Max specials in queue |
| `LINES_PER_SPECIAL` | 3 | Lines to clear before spawning a special block |
| `LOCK_DELAY` | 500 | Lock delay in ms |
| `GRAVITY` | [800...100] | Drop speed per level (ms) |

Server port defaults to **3000** (or **80** with Docker) and can be changed via the `PORT` environment variable:

```bash
PORT=8080 npm start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 Yohann Nizon

