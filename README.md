# AgentKin 2.0 (Active Intelligence) 🧠💸

**AgentKin** is a decentralized workspace where humans and autonomous AI agents collaborate. Built for privacy ("Ghost Mode"), speed (Solana/L2), and autonomy.

## 🚀 Features

### 1. **Autonomous Intelligence** (New!)
- **News Scraper Agent**: A Python worker (`scripts/autonomous_worker.py`) constantly monitors HackerNews for intel.
- **Smart Tasks**: Agents analyze data and post prioritized tasks directly to your dashboard.
- **Auto-Launch**: The worker starts automatically with the platform.

### 2. **Financial Core**
- **Wallet Connect**: Integrate your **Phantom Wallet** (Solana) directly in the browser.
- **Live Assets**: Real-time SOL/BTC price feeds powered by CoinGecko.
- **Metrics**: Live system stats (Agent Count, Task Queue, Uptime).

### 3. **Privacy First**
- **Ghost Mode**: Toggle "Incognito" to instantly wipe local storage and session data.
- **Zero-Knowledge**: Client-side ephemeral keys for secure operations.

### 4. **Progressive Web App (PWA)**
- **Installable**: Runs as a native app on Desktop/Mobile.
- **Persistent Button**: "Install App" always available in header.

---

## 🛠️ Quick Start

### Windows (PowerShell)
One command to launch the Backend (FastAPI), Frontend (Dashboard), and Autonomous Worker:

```powershell
.\start_agentkin.ps1
```

*   **Frontend**: `http://localhost/agentkin/index.html` (or opens in default browser)
*   **Backend API**: `http://localhost:8000`
*   **Worker Logs**: Minimized terminal window.

---

## 💻 Technical Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No framework bloat).
    - **Physics Engine**: Custom JS interactions.
    - **Web3**: `window.solana` (Phantom Adapter).
- **Backend**: FastAPI (Python 3.10+).
    - **Database**: Prisma (SQLite/PostgreSQL).
    - **Worker**: `requests` + `schedule` (Python).

---

## ☁️ Deployment

### Frontend (Vercel)
A `vercel.json` is included for static deployment.
1.  Push to GitHub.
2.  Import project in Vercel.
3.  Output Directory: `.` (Root).

### Backend (Railway/Render)
A `Procfile` is included for Python hosting.
1.  Push `backend-fastapi/` folder.
2.  Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

---

## 📂 Project Structure
- `index.html` - Main Dashboard (Frontend).
- `terms.html` - Privacy Policy / Terms.
- `backend-fastapi/` - Neural Core (API).
- `scripts/` - Autonomous Agents (`autonomous_worker.py`).
- `start_agentkin.ps1` - Universal Launcher.
