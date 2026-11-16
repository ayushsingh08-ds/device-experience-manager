# Device Experience Manager (DEM)

> **Enterprise Endpoint Observability, Real-Time Diagnostic Engine & Automated Remediation Platform (DEX)**  
> Built with **React 19**, **Node.js / Express**, **TypeScript**, **PostgreSQL** (via **Neon**), **Prisma ORM**, **Tailwind CSS v4**, and **Docker**.

---

## 🌐 Live Production Deployment

| Service | Provider | Status | URL |
|---|---|---|---|
| **Web Dashboard** | **Vercel** | 🟢 Live | **[device-experience-manager.vercel.app](https://device-experience-manager.vercel.app/)** |
| **Backend REST API** | **Render** | 🟢 Live | **[dem-backend-k8xw.onrender.com/health](https://dem-backend-k8xw.onrender.com/health)** |
| **Serverless Database** | **Neon** | 🟢 Active | PostgreSQL 16 (AWS ap-southeast-1) |

### 🔑 Demo Login Credentials
To explore the live dashboard immediately:
- **Email:** `admin@dem.local`
- **Password:** `AdminPassword123!`
- **Role:** `ADMIN` / Operator

---

## 📌 Executive Summary & Problem Statement

Modern enterprise IT teams manage fleets of distributed employee laptops and workstations. Unmonitored hardware degradation leads to lost productivity, unexpected crashes, and silent security risks.

**Device Experience Manager (DEM)** is a **Digital Employee Experience (DEX)** platform that provides:
1. **Physical & Fleet Device Inventory**: Auto-discovers and registers endpoints with hardware specs, network identifiers (IPv4, MAC), and heartbeat monitoring (`ONLINE`, `DEGRADED`, `OFFLINE`).
2. **Real Hardware Metric Ingestion**: Non-blocking collector sampling actual host hardware metrics (CPU utilization via delta tick sampling, physical RAM usage, and root drive disk space via native `statfs`).
3. **Automated Diagnostic Engine**: Real-time evaluation of metric streams against operational thresholds with **duplicate alert suppression** and heartbeat timeout offline detection.
4. **Approval-Gated Remediation State Machine**: Safe, operator-approved troubleshooting workflows (`PENDING_APPROVAL` ➔ `EXECUTING` ➔ `COMPLETED` / `REJECTED`) that automatically resolve associated alerts.
5. **Immutable Compliance Audit Trail**: SOC2/ISO-ready governance ledger recording operator IDs, action timestamps, and execution payloads.
6. **Monochrome 2D Technical-Sketch UI**: Clean, high-density operations interface designed to look like an engineering blueprint with animated outline icons, SVG sparklines, and interactive Recharts telemetry graphs.

---

## 🏗 End-to-End System Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      Physical Endpoint Agent                           │
 │     (Live Hardware Sampling: os.cpus delta, mem, fs.statfs)            │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP POST /api/telemetry
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │              Node.js / Express 5 / TypeScript API                      │
 │                                                                        │
 │  ┌──────────────┐   ┌───────────────┐   ┌───────────────────────────┐  │
 │  │  Zod Schema  │ ─►│ JWT Auth/RBAC │ ─►│ Controllers (REST)        │  │
 │  └──────────────┘   └───────────────┘   └─────────────┬─────────────┘  │
 │                                                       │                │
 │         ┌─────────────────────────────────────────────┴──────────┐     │
 │         ▼                                                        ▼     │
 │  ┌──────────────┐                                         ┌──────────┐ │
 │  │  Diagnostic  │                                         │Remediation││
 │  │ Rule Engine  │                                         │  Machine │ │
 │  └──────┬───────┘                                         └────┬─────┘ │
 └─────────┼──────────────────────────────────────────────────────┼───────┘
           │                                                      │
           ▼                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │              Serverless PostgreSQL 16 (Neon / Prisma)                  │
 │                                                                        │
 │  [User]    [Device]   [Telemetry]   [Alert]   [Remediation]   [Audit]  │
 │  Composite Index: Telemetry(deviceId, timestamp DESC)                  │
 └───────────────────────────────────▲────────────────────────────────────┘
                                     │ REST API (Bearer JWT)
 ┌───────────────────────────────────┴────────────────────────────────────┐
 │               React 19 + Tailwind v4 Monochrome UI                     │
 │      (Dashboard, Devices, Alerts Console, Remediation, Audit Logs)     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Live Hardware Telemetry: Running the Real Agent

Unlike synthetic demo projects, DEM includes an actual **Physical Host Hardware Collector**:

### Stream Telemetry from Your Physical Machine to the Live Cloud App
You can run the agent locally on your laptop and watch your actual hardware numbers stream into the live Vercel dashboard:

```powershell
cd backend
$env:API_URL="https://dem-backend-k8xw.onrender.com/api/telemetry"
npm run agent
```

Output:
```text
======================================================
       DEM Physical Endpoint Agent Initializing       
======================================================
 Hostname : LAPTOP-3S81DC1D
 OS       : Windows 10.0.26300 (x64)
 IPv4     : 192.168.1.185
 MAC      : DC:45:46:A0:BF:BD
------------------------------------------------------
Streaming live physical hardware telemetry every 3s...
[RealAgent 11:54:01 PM] Live Telemetry: CPU:  10.8% | RAM:  91.5% | Disk:  93.8%
```

### Fleet Simulation with Real Host Metrics
To simulate an enterprise fleet with live metrics:
```powershell
cd backend
npm run simulate:real
```

---

## 🛠 Technology Stack Justification

| Layer | Technology | Architectural Justification |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + Tailwind v4 | Built with React 19 and custom monochrome hand-sketched 2D styling for low cognitive fatigue in enterprise operations. |
| **Visualizations** | Recharts + Motion | Smooth, accessible data visualization with animated Lucide icons adhering to `prefers-reduced-motion`. |
| **Backend** | Express 5 + TypeScript | High-throughput non-blocking I/O ideal for continuous telemetry ingestion. Strict compile-time safety. |
| **Validation** | Zod | Runtime contract validation bridging TypeScript's compile-time type erasure at network boundaries. |
| **Database** | PostgreSQL 16 + Neon | Serverless PostgreSQL with connection pooling, ACID transaction guarantees, and automated schema migrations. |
| **ORM** | Prisma ORM | Type-safe client, migration history, and connection management. |
| **Testing** | Vitest + Supertest | Integration test suite executing against in-memory sockets in < 900ms. |
| **Cloud Hosting** | Vercel (UI) + Render (API) | Zero-maintenance serverless global CDN coupled with containerized Node.js API runtime. |

---

## ⚡ Core API Endpoints

### Authentication & RBAC
- `POST /api/auth/register` — Create administrator / operator profile.
- `POST /api/auth/login` — Authenticate and receive HMAC-signed JWT.
- `GET /api/auth/me` — Retrieve authenticated user context.

### Device Fleet Management
- `POST /api/devices/register` — Enroll hardware endpoint (`ADMIN`, `OPERATOR`).
- `GET /api/devices` — Paginated device inventory with search & status filters (`ONLINE`, `DEGRADED`, `OFFLINE`).
- `GET /api/devices/:id` — Specific device details with recent telemetry pulses.

### Telemetry Ingestion
- `POST /api/telemetry` — Ingestion point for endpoint agents (atomic transaction updating heartbeat & saving telemetry).
- `GET /api/telemetry/:deviceId` — Historical time-series telemetry metrics.

### Diagnostic Engine & Alerts
- `GET /api/alerts` — Active incident feed with status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`) and severity filters.
- `PATCH /api/alerts/:id/acknowledge` — Transition alert to `ACKNOWLEDGED`.
- `PATCH /api/alerts/:id/resolve` — Mark incident as resolved.

### Remediation & Governance
- `POST /api/remediations` — Queue troubleshooting action (`CLEANUP_TEMP_FILES`, `RESTART_BACKGROUND_SERVICE`, etc.).
- `POST /api/remediations/:id/approve` — Approve and execute fix (auto-resolves attached alert, prevents double execution via `409 Conflict`).
- `GET /api/audit-logs` — Immutable compliance history tracking administrative operations.

---

## 🧪 Automated Test Suite (Vitest)

All integration tests validate security, validation schemas, and database transactions:

```bash
cd backend
npm test
```

```text
 ✓ src/__tests__/api.test.ts (11 tests) 862ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

---

## 🐳 Local Docker Deployment

Run the complete platform locally using Docker Compose:

```bash
docker compose up --build -d
```

- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- **PostgreSQL:** `localhost:5433`

---

## 📄 License
MIT License. Developed for enterprise endpoint observability and modern systems engineering portfolios.
