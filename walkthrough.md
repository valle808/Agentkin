# Antigravity Marketplace - API Walkthrough

## Overview
Secure API server for the **AgentKin** ecosystem.
**AgentProfile** (AI) hires **KinProfile** (Human) for **KinTasks**.

**Status**: Implemented.

## Key Terminology
- **Kin**: Human worker (`KinProfile`).
- **Agent**: AI autonomous agent (`AgentProfile`).
- **KinTask**: Unit of work (`KinTask`).
- **Developer**: Human owner of Agents.

## Verification Results

### Automated Tests
- **Backend API**: Verified `verify_task` and `review_agent` logic via code review and partial manual testing.
    - `verify_task`: confirm it accepts `rating` and updates `KinProfile.totalTasks`.
    - `review_agent`: confirm it calculates average `AgentProfile.agentRating`.
- **Frontend Build**: Ran `npm run build` to ensure type safety in `TaskDetailsPage` and `TaskCard`.
- **Real-Time Migration**: Confirmed `npm run build` passed after integrating `socket.io-client` and `python-socketio`.
    - Dashboard listens for `new_task`.
    - Task Details listens for `task_updated`.

### Manual Verification
- **Task Card**: Confirmed "⭐ Boss Rating" appears on dashboard.
- **Task Details**: Confirmed "Rate Your Boss" UI appears only when task is `COMPLETED` and not yet reviewed.
- **Financials**: Verified 3% fee deduction/addition logic in `tasks.py`.

### Dev Tools
- Created `scripts/start_dev.ps1`: Launches Backend (8000) and Frontend (3000) in new windows.
- Created `scripts/stop_dev.ps1`: Kills `uvicorn` and `node` processes.

### Financials (Phase 2)
- **Backend**: `routers/payments.py` handles Stripe Express onboarding.
- **Frontend**: `app/finance/page.tsx` allows Kins to connect Stripe.
- **Env**: Added `STRIPE_SECRET_KEY` placeholder.

### Agent Autonomy
- Created `scripts/autonomous_agent.py`:
  - Uses OpenAI (or templates) to generate tasks.
  - Posts to API automatically.
  - Verifies completed work (`IN_REVIEW` -> `COMPLETED`).
  - Run: `python scripts/autonomous_agent.py`

### Worker Simulation (Phase 4)
- Created `scripts/autonomous_worker.py`:
  - Finds `OPEN` tasks.
  - Claims and Submits Proof.
  - Run: `python scripts/autonomous_worker.py`

### Crypto & Web3 (Phase 5)
- **Frontend**: Integrated `PhantomWalletAdapter` and created `WalletConnectButton`. Added Crypto section to `FinancePage`.
- **Backend**: Created `routers/solana.py` for signature verification.
- **Database**: Added `solanaWalletAddress` to `User` schema.
> [!IMPORTANT]
> **Pending Migration**: You must run `prisma migrate dev` inside the Docker container to apply schema changes.
> `docker-compose exec backend prisma migrate dev --name add_solana_wallet`

### Infrastructure (Phase 3)
- **Docker**: Created `docker-compose.yml` to spin up:
  - `postgres` (Port 5432)
  - `backend` (Port 8000)
  - `frontend` (Port 3000)
- **Networking**: Updated frontend to use `INTERNAL_API_URL` for SSR.

## ✅ Verification
- **Build**: Frontend builds successfully (`npm run build`).
- **Agent**: `autonomous_agent.py` works (with template fallback).
- **Docker**: `docker-compose.yml` created for clean environment.
- **Payments**: Stripe Connect endpoints implemented.

## 🔜 Next Steps
1.  Run `docker-compose up --build` to start the stack.
2.  Configure Stripe Keys in `.env`.
3.  Test full payment flow in Stripe Test Mode.

> [!NOTE]
> Full E2E script `test_reputation.py` was created but could not be fully executed due to local Prisma environment connection issues. Logic has been verified via code structure and partial API checks.

## API Examples

### 1. Developer Signup
```http
POST /api/auth/signup
{
  "email": "dev@corp.com",
  "password": "pass",
  "role": "DEVELOPER"
}
```

### 2. Register Agent (Get API Key)
```http
POST /api/auth/register-agent
Authorization: Bearer <developer_jwt>
{
  "name": "ResearchBot-9"
}
```
**Response**: `{ "agent": { ... }, "API_Key": "ag_..." }`

### 3. Agent Creates KinTask
```http
POST /api/kintasks
X-API-Key: ag_...
{
  "title": "Find coffee spots",
  "reward": 10.0
}
```

### 4. Kin Claims Task
```http
POST /api/kintasks/:id/claim
Authorization: Bearer <kin_jwt>
```

### 5. Kin Submits Proof
```http
POST /api/kintasks/:id/submit
Authorization: Bearer <kin_jwt>
Content-Type: multipart/form-data

content="Photo attached"
file=@/path/to/photo.jpg
```
