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

---

## Tech Stack
- **Runtime**: Python 3.12 (Backend) / Node.js (Frontend)
- **Framework**: FastAPI (Backend) / Next.js (Frontend)
- **ORM**: Prisma (PostgreSQL)
- **Payments**: Stripe (ACP + SPT)
- **Real-time**: Socket.IO (python-socketio + socket.io-client)

## Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostgreSQL 15 (Containerized)
- **Services**: Frontend, Backend, Database
