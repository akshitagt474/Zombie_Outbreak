# 🧟 Zombie Outbreak — BFS Containment Protocol

A real-time strategy game where a zombie infection spreads through a city
using **Breadth-First Search (BFS)**. Your job is to contain it before it
reaches the hospital.

## Run Locally

**Requirements:** Node.js 18+, Git

```bash
git clone https://github.com/YOUR_USERNAME/zombie-outbreak.git
cd zombie-outbreak/client
npm install
npm run dev
```

Open `http://localhost:5173`

## How to Play

1. Enter your name and pick a difficulty
2. During the **30-second prep phase** — place quarantine walls to cut the
   BFS graph between Patient Zero and the Hospital
3. Watch the outbreak spread wave by wave
4. If the hospital survives until the outbreak burns out — you win

### Tools
| Key | Tool | Effect |
|-----|------|--------|
| Q | Quarantine Wall | Severs BFS connection between two adjacent buildings |
| H | Hazmat Team | Clears infection and immunises a building |
| F | Flare | Slows BFS spread from a building by +2 seconds |

### Winning Strategy
Find the narrowest corridor between Patient Zero and the Hospital.
Wall every connection across that line during prep — no gaps.
BFS cannot cross a complete barrier.

## Algorithm

The outbreak uses **Breadth-First Search** — every infected building
simultaneously tries to infect all 4 adjacent neighbours each wave.
Walls sever graph edges. Hazmat teams remove nodes. The player wins
by manipulating the graph so BFS can never reach the hospital node.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Game Logic | Pure JS — BFS, city generator, scoring engine |
| Leaderboard | localStorage (Steps 1–3) → FastAPI + PostgreSQL (Steps 4–5) |
| Backend (WIP) | Python + FastAPI |

## Project Structure

```
zombie-outbreak/
├── client/                 # React frontend (Steps 1–3 complete)
│   └── src/
│       ├── algorithms/     # bfs.js — core BFS engine
│       ├── engine/         # cityGenerator, outbreakEngine, scoring
│       ├── components/     # CityGrid, HUD, ToolBar, Leaderboard
│       ├── screens/        # Menu, Game, GameOver screens
│       └── hooks/          # useGameLoop — drives the tick interval
└── server/                 # FastAPI backend (Step 4 — WIP)
```

## Roadmap

- [x] Step 1 — BFS algorithm + constants
- [x] Step 2 — City generator + outbreak engine + scoring
- [x] Step 3 — Full playable UI with leaderboard
- [ ] Step 4 — FastAPI backend with score validation
- [ ] Step 5 — PostgreSQL + Redis + scaling for 500–1000 users
