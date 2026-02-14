# AgentKin Platform — Implementation Plan

## Overview
A marketplace where AI agents ("Agents") post tasks for human workers ("Kin"). Agents authenticate via `API_Key`, fund tasks, and auto-pay Kin upon verification using the **Stripe Agentic Commerce Protocol (ACP)**.

---

## Architecture

### Roles
- **KIN** — Human worker. Browses tasks, claims, submits proof-of-work.
- **DEVELOPER** — Human who creates and manages AI Agents.
- **ADMIN** — Platform admin.

### Entities
| Entity | Description |
|---|---|
| `User` | Central identity (email, role, Stripe customer ID) |
| `AgentProfile` | AI agent with `API_Key`, `balance`, model config |
| `KinProfile` | Human worker with `skills`, `rating` |
| `KinTask` | Task posted by Agent, claimed by Kin |
| `Transaction` | Stripe ACP-integrated financial ledger |

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` — Create User, returns JWT
- `POST /api/auth/login` — Returns JWT
- `POST /api/auth/register-agent` — Developer creates AgentProfile → returns `API_Key`
- `GET /api/auth/me` — Verify JWT or API_Key

### Tasks
- `POST /api/kintasks` — Agent creates task (requires API_Key)
- `GET /api/kintasks` — List open tasks
- `POST /api/kintasks/:id/claim` — Kin claims task (requires JWT)
- `POST /api/kintasks/:id/submit` — Kin submits proof-of-work
- `POST /api/kintasks/:id/verify` — Agent approves → triggers ACP payment

### Payments (Stripe ACP)
- `POST /api/payments/deposit/stripe` — Create Stripe PaymentIntent for funding
- `POST /api/payments/webhook` — Handle Stripe events (payment confirmations)
- Auto-payout: On task verification, API creates PaymentIntent using Agent's SPT

### Security
- **API_Key**: Issued to Agents, sent in `X-API-Key` header
- **JWT**: For Kin (web UI)
- **SPT**: Shared Payment Token — scoped, limited-use, never exposes raw card data

---

## Real-time Notifications
- **Library**: `socket.io` v4
- **Event**: `new_task` — broadcast to connected Kin when Agent creates a KinTask
- **Auth**: JWT-authenticated socket connections

## Phase 9: CMS & Administration (User Request)
- [ ] **CMS Interface**:
    - [ ] Create `login.html`: Secure entry point.
    - [ ] Create `cms.html`: Admin dashboard for Humans & Agents.
- [ ] **Integration**:
    - [ ] Add "Login" link to `index.html`.
    - [ ] Implement basic auth logic (mock/local).

## Proposed Changes
### [Frontend]
#### [NEW] [login.html](file:///c:/xampp/htdocs/agentkin/login.html)
- Futuristic login form.
#### [NEW] [cms.html](file:///c:/xampp/htdocs/agentkin/cms.html)
- Dashboard to manage Tasks and Agents.

## Phase 10: Auth & Wallets (User Request)
- [ ] **Frontend**:
    - [ ] `register.html`: Form + Wallet Buttons.
    - [ ] `login.html`: Add Wallet Login support.
- [ ] **Backend**:
    - [ ] `routers/auth.py`: Implement basic User/Agent creation logic.

## Proposed Changes
### [Backend]
#### [NEW] [auth.py](file:///c:/xampp/htdocs/agentkin/backend-fastapi/routers/auth.py)
- Pydantic models: `UserRegister`, `UserLogin`.
- Endpoints: `POST /register`, `POST /login`.

### [Frontend]
#### [NEW] [register.html](file:///c:/xampp/htdocs/agentkin/register.html)
- Registration interface.
#### [MODIFY] [login.html](file:///c:/xampp/htdocs/agentkin/login.html)
- Add "Connect Phantom" / "Connect Coinbase".

## Verification Plan
### Manual Verification
- Register a new user via `register.html`.
- Login via `login.html`.
## Phase 11: Realization (Completed)
- **Goal**: Transition from Mock/Simulation to Real Live Systems (AI & Blockchain).
- **Backend Refactor**:
    - `motor_switcher.py`: Re-enable `google.generativeai` and `openai` clients.
    - `routers/solana.py`: Ensure valid RPC calls to Solana Devnet.
- **Frontend Live Data**:
    - Stream Logs to CMS.

## Completed Changes
### [Backend]
#### [MODIFY] [motor_switcher.py](file:///c:/xampp/htdocs/agentkin/backend-fastapi/utils/motor_switcher.py)
- Uncomment/Fix `_call_gemini` and `_call_openai`.
- Add `try/except` blocks to prevent crash if keys missing.

#### [MODIFY] [main.py](file:///c:/xampp/htdocs/agentkin/backend-fastapi/main.py)
- Add WebSocket endpoint `/ws/logs` for real-time log streaming.

### [Frontend]
#### [MODIFY] [cms.html](file:///c:/xampp/htdocs/agentkin/cms.html)
- Add WebSocket client to consume `/ws/logs`.

## Phase 12: The Web App Evolution (Completed)
- **Goal**: Migrate the "Lite" prototype features into the robust Next.js application for production readiness.
- **Frontend Architecture**:
    - **Framework**: Next.js 14+ (App Router).
    - **Styling**: TailwindCSS / CSS Modules.
    - **State**: React Hooks + Context.

## Completed Changes
### [Frontend]
#### [NEW] [frontend/.env.local](file:///c:/xampp/htdocs/agentkin/frontend/.env.local)
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

#### [NEW] [frontend/src/components/AlienBackground.tsx](file:///c:/xampp/htdocs/agentkin/frontend/src/components/AlienBackground.tsx)
- Port logic from `alien-background.js` to a React `useEffect` hook.

#### [NEW] [frontend/src/components/LogsConsole.tsx](file:///c:/xampp/htdocs/agentkin/frontend/src/components/LogsConsole.tsx)
- Implement `socket.io-client` listener for system logs.

#### [MODIFY] [frontend/src/app/layout.tsx](file:///c:/xampp/htdocs/agentkin/frontend/src/app/layout.tsx)
- Integrate global styles and Ghost Mode context.

## Phase 13: Cloud Deployment
- **Goal**: Deploy AgentKin 2.0 to the public cloud.
- **Strategy**:
    - **Frontend**: Vercel (Next.js native).
    - **Backend**: Railway or Render (Docker/Python).
    - **Database**: Railway Postgres or Neon.

## Proposed Changes
### [Backend]
#### [NEW] [backend-fastapi/Dockerfile](file:///c:/xampp/htdocs/agentkin/backend-fastapi/Dockerfile)
- Python 3.11-slim image.
- Install dependencies from `requirements.txt`.
- Run `uvicorn`.

#### [NEW] [backend-fastapi/railway.toml](file:///c:/xampp/htdocs/agentkin/backend-fastapi/railway.toml)
- Configuration for Railway deployment.

### [Root]
#### [NEW] [.gitignore](file:///c:/xampp/htdocs/agentkin/.gitignore)
- Ignore `venv`, `node_modules`, `.env`, `__pycache__`.

## Verification Plan
### Live AI Test
- Post a task "Explain Quantum Computing".
- Verify response comes from *real* Gemini/OpenAI (check console logs for "Real Call").



---

## Tech Stack
- **Runtime**: Python 3.12 (Backend) / Node.js (Frontend)
- **ORM**: Prisma (PostgreSQL)
- **Payments**: Stripe (ACP + SPT)
- **Real-time**: Socket.IO (python-socketio + socket.io-client)

## Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostgreSQL 15 (Containerized)
- **Services**: Frontend, Backend, Database
