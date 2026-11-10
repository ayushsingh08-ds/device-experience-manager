# Device Experience Manager (DEM)

> **Endpoint Health Monitoring, Real-Time Diagnostic Engine & Automated Remediation Platform**
> Built with Node.js, Express, TypeScript, PostgreSQL, Prisma, React 19, Tailwind CSS v4, Docker, and GitHub Actions.

---

## 📌 Executive Summary & Problem Statement

Modern enterprise IT teams manage thousands of distributed employee endpoints (laptops, workstations, edge machines). Unmonitored hardware issues cause severe productivity loss, sudden system crashes, and security vulnerabilities.

**Device Experience Manager (DEM)** provides:
1. **Endpoint Fleet Inventory**: Centralized device registry tracking hardware configurations, network identifiers (IPv4, MAC), and operational status (`ONLINE`, `OFFLINE`, `DEGRADED`).
2. **High-Frequency Telemetry Ingestion**: Scalable REST pipeline receiving CPU, RAM, Disk, and Heartbeat metrics from distributed endpoint agents.
3. **Rule-Based Diagnostic Engine**: Real-time evaluation of metric streams against operational thresholds with **duplicate incident suppression**.
4. **Admin-Approved Remediation State Machine**: Safe, operator-approved simulated troubleshooting workflows (`PENDING_APPROVAL` ➔ `APPROVED` ➔ `EXECUTING` ➔ `COMPLETED`).
5. **Security & Immutable Compliance Ledger**: Role-Based Access Control (`ADMIN`, `OPERATOR`, `VIEWER`), JWT authentication, bcrypt password hashing, and audit logging.

---

## 🏗 End-to-End System Architecture

```text
  ┌────────────────────────────────────────────────────────┐
  │                 Endpoint Agent Simulator               │
  │     (Streams CPU, RAM, Disk, Heartbeat Pulses)         │
  └───────────────────────────┬────────────────────────────┘
                              │ POST /api/telemetry
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              Node.js / Express / TypeScript            │
  │                                                        │
  │  ┌──────────────┐   ┌───────────────┐  ┌────────────┐  │
  │  │  Zod Inputs  │ ─►│ Auth & RBAC   │─►│ Controller │  │
  │  └──────────────┘   └───────────────┘  └─────┬──────┘  │
  │                                              │         │
  │         ┌────────────────────────────────────┴───┐     │
  │         ▼                                        ▼     │
  │  ┌──────────────┐                         ┌──────────┐ │
  │  │  Diagnostic  │                         │Remediation││
  │  │ Rule Engine  │                         │  Machine │ │
  │  └──────┬───────┘                         └────┬─────┘ │
  └─────────┼──────────────────────────────────────┼───────┘
            │                                      │
            ▼                                      ▼
  ┌────────────────────────────────────────────────────────┐
  │              PostgreSQL 16+ Database (Prisma)          │
  │                                                        │
  │  [User]    [Device]   [Telemetry]   [Alert]   [Audit]  │
  │  Composite Index: Telemetry(deviceId, timestamp DESC)  │
  └───────────────────────────▲────────────────────────────┘
                              │
  ┌───────────────────────────┴────────────────────────────┐
  │               React 19 + Tailwind v4 UI                │
  │     (Executive Dashboard, Alerts Console, Remediation) │
  └────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack Justification

| Layer | Technology | Engineering Reasoning |
| :--- | :--- | :--- |
| **Backend** | Node.js + Express + TypeScript | Single-threaded non-blocking event loop ideal for high-throughput I/O ingestion. TypeScript guarantees compile-time safety. |
| **Validation** | Zod | Enforces strict runtime boundary type-safety. Bridges TypeScript's compile-time type erasure. |
| **Database** | PostgreSQL 16+ | ACID transactions prevent race conditions during remediation; composite B-Tree indexes optimize time-series queries. |
| **ORM** | Prisma ORM | Automated schema migrations, type-safe query builders, connection pooling singleton. |
| **Frontend** | React 19 + Vite + Tailwind v4 | Blazing fast client bundle (1.1s build), native ESM hot reloading, utility-first dark mode UI. |
| **State** | TanStack Query + Zustand | Clean separation of remote server state (polling, deduplication) from local synchronous client state. |
| **Testing** | Vitest + Supertest | In-memory ephemeral socket testing (no port conflicts), 11/11 tests pass in < 600ms. |
| **DevOps** | Docker Compose + GitHub Actions | Multi-stage Docker packaging and automated CI test execution on every commit. |

---

## ⚡ Core REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register administrator or operator (`409 Conflict` on duplicate).
- `POST /api/auth/login` — Issues HMAC-signed JWT.
- `GET /api/auth/me` — Verified user profile context (`401` if missing/invalid).

### Fleet Management
- `POST /api/devices/register` — Enroll hardware endpoint (`ADMIN`, `OPERATOR`).
- `GET /api/devices` — Paginated fleet listing (`page`, `limit`, `status`, `search`).
- `GET /api/devices/:id` — Single device details with 10 most recent telemetry records and open alerts.
- `DELETE /api/devices/:id` — Decommission device (`ADMIN` only).

### Telemetry Pipeline
- `POST /api/telemetry` — Ingestion point for endpoint agents (atomic transaction updating device heartbeat and persisting metric row).
- `GET /api/telemetry/:deviceId` — Time-series telemetry history.

### Diagnostic & Alerts
- `GET /api/alerts` — Incident console with status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`) and severity filters.
- `PATCH /api/alerts/:id/status` — Operational status transition.

### Remediation & State Machine
- `POST /api/remediations` — Queue a remediation action (`PENDING_APPROVAL`).
- `POST /api/remediations/:id/approve` — Approve and execute simulation (`COMPLETED`, auto-resolves alert, returns `409 Conflict` on double execution).
- `GET /api/audit-logs` — Immutable compliance history of administrative operations.

---

## 🧪 Automated Test Suite (Vitest + Supertest)

Run the test suite:
```bash
cd backend
npm test
```

```text
 ✓ src/__tests__/api.test.ts (11 tests) 588ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

---

## 🚀 One-Command Docker Deployment

To run the complete platform (PostgreSQL, Backend API, and React Frontend Nginx) in Docker:

```bash
docker compose up --build -d
```

- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🎯 Technical Interview Defense Guide

When asked to explain this system in technical interviews:

1. **Why is `app.ts` separated from `server.ts`?**
   > *To enable parallel, isolated integration testing using Supertest over in-memory ephemeral ports without encountering `EADDRINUSE` port-collision errors.*
2. **How does the system prevent duplicate alert storms?**
   > *Before inserting an alert, the Diagnostic Engine checks PostgreSQL for active unacknowledged alerts matching `deviceId` and `title`. If one is currently `OPEN`, duplicate alerts are suppressed.*
3. **How are race conditions prevented during remediation?**
   > *The remediation state machine checks `status === 'PENDING_APPROVAL'`. If concurrent requests attempt to execute an action already in `EXECUTING` or `COMPLETED` state, the API rejects with `409 Conflict`.*
4. **How are time-series telemetry queries optimized?**
   > *We added a compound index `@@index([deviceId, timestamp(sort: Desc)])` in Prisma, transforming $O(N)$ sequential table scans into $O(\log N)$ B-Tree seeks for recent metrics.*

---

## 📄 License
This project is licensed under the MIT License.
