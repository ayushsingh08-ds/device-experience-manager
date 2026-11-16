# Device Experience Manager (DEM)

A full-stack endpoint observability and automated remediation platform (Digital Employee Experience / DEX).

DEM monitors computer hardware health, flags threshold anomalies in real time, orchestrates operator-approved remediation workflows, and maintains an immutable audit log.

---

## Live Demo

| Service | Provider | Status | URL |
|---|---|---|---|
| Web Dashboard | Vercel | Online | https://device-experience-manager.vercel.app |
| Backend API | Render | Online | https://dem-backend-k8xw.onrender.com/health |
| Cloud Database | Neon | Online | PostgreSQL 16 |

### Demo Credentials
- Email: `admin@dem.local`
- Password: `AdminPassword123!`
- Role: `ADMIN`

---

## What Problem This Solves

In modern organizations, IT administrators must track hundreds of remote employee workstations. Unmonitored hardware issues cause application crashes, performance slowdowns, and lost productivity.

DEM solves this through a three-part system:
1. A background agent runs on the user machine to measure live hardware performance (CPU, memory, disk).
2. The central backend evaluates metric streams against diagnostic thresholds (for example, CPU sustained at or above 90%).
3. When an anomaly is detected, the platform triggers an alert, allows an IT operator to approve a fix, and records an audit log for security compliance.

---

## Core Capabilities

- Physical Device Inventory: Automatically identifies and tracks machines by hostname, IP address, MAC address, and operating system.
- Real Hardware Telemetry: Gathers live CPU utilization, physical RAM usage, and disk space from the host machine using native system calls.
- Automated Alert Engine: Continuously scans telemetry pulses. Detects high CPU, memory pressure, low disk space, and offline heartbeat timeouts while preventing duplicate alert spam.
- Remediation State Machine: Governs troubleshooting actions (`PENDING_APPROVAL` to `EXECUTING` to `COMPLETED` or `REJECTED`). Automatically marks corresponding alerts as resolved upon successful execution.
- Compliance Audit Trail: Immutable historical log recording operator identity, action types, resource IDs, and timestamps.
- Technical 2D Interface: Built with React 19, high-density layout, monochrome outline icons, and interactive health charts.

---

## Architecture

```text
[ Physical Machine / Endpoint Agent ]
              |
              | HTTP POST /api/telemetry (Every 3 seconds)
              v
[ Node.js + Express 5 Backend API ]
   - Zod runtime input validation
   - JWT authentication and role-based access control
   - Background Diagnostic Rule Engine
   - Remediation state machine
              |
              v
[ PostgreSQL Database (Neon Serverless) ]
   - Tables: User, Device, Telemetry, Alert, RemediationAction, AuditLog
   - Composite B-Tree Index: Telemetry(deviceId, timestamp DESC)
              ^
              | REST API Calls (Bearer JWT)
[ React 19 + Tailwind v4 Web Dashboard ]
   - Executive Overview & KPI cards
   - Live Device Inventory & Search
   - Incident Alerts Console
   - Remediation Approval Queue
   - Compliance Audit Log
```

---

## How Real Hardware Telemetry Works

Web browsers run inside a security sandbox and cannot read your laptop hard drive, CPU cycles, or MAC address.

To capture authentic metrics, DEM uses a native background agent (`realDeviceAgent.ts`) that runs directly on the operating system.

### Data Collection Details
- CPU Utilization: Computed by measuring delta clock ticks (`idle` versus `total`) across all CPU cores over a 400ms sampling window using Node.js `os.cpus()`.
- RAM Usage: Calculated as `((total - free) / total) * 100` using Node.js `os.totalmem()` and `os.freemem()`.
- Disk Space: Measured directly on the system partition (`C:\` on Windows, `/` on Linux and macOS) using native `fs.promises.statfs`.
- Device Identity: Reads the machine hostname (`os.hostname()`), OS version, primary IPv4 address, and network MAC address.

### Streaming Live Data from Your Machine to the Cloud Dashboard

Run the physical agent in your terminal:

```powershell
cd backend
$env:API_URL="https://dem-backend-k8xw.onrender.com/api/telemetry"
npm run agent
```

Terminal output:
```text
======================================================
       DEM Physical Endpoint Agent Initializing       
======================================================
 Hostname : LAPTOP-3S81DC1D
 OS       : Windows 10.0.26300 (x64)
 IPv4     : 192.168.1.185
 MAC      : DC:45:46:A0:BF:BD
------------------------------------------------------
[RealAgent 12:05:00 AM] Live Telemetry: CPU: 12.3% | RAM: 91.5% | Disk: 93.8%
```

Refresh the web dashboard at `https://device-experience-manager.vercel.app` to see your machine listed and its metrics updated live.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 | User interface and data visualization |
| UI Libraries | Recharts, Motion, Lucide React | Metrics charting and micro-animations |
| Backend | Node.js, Express 5, TypeScript | REST API and ingestion pipeline |
| Validation | Zod | Runtime schema validation |
| Database | PostgreSQL 16 (Neon Serverless) | Relational persistence with connection pooling |
| ORM | Prisma ORM | Type-safe database queries and migrations |
| Testing | Vitest, Supertest | Integration and unit testing |
| Hosting | Vercel (Frontend), Render (Backend) | Cloud deployment and global CDN |

---

## API Reference

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate and obtain a JWT token.
- `GET /api/auth/me` - Retrieve current user profile.

### Device Management
- `POST /api/devices/register` - Enroll a new device.
- `GET /api/devices` - List devices with pagination and search.
- `GET /api/devices/:id` - Fetch single device details and recent telemetry.
- `DELETE /api/devices/:id` - Remove a device from the fleet.

### Telemetry Pipeline
- `POST /api/telemetry` - Endpoint agent ingestion target.
- `GET /api/telemetry/:deviceId` - Retrieve historical telemetry series.

### Alerts and Diagnostics
- `GET /api/alerts` - List active alerts by status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`).
- `PATCH /api/alerts/:id/acknowledge` - Mark an alert as acknowledged.
- `PATCH /api/alerts/:id/resolve` - Mark an alert as resolved.

### Remediation and Governance
- `POST /api/remediations` - Request a remediation action.
- `GET /api/remediations` - List remediation requests and execution logs.
- `POST /api/remediations/:id/approve` - Approve and execute remediation.
- `POST /api/remediations/:id/reject` - Reject remediation request.
- `GET /api/audit-logs` - Retrieve immutable security compliance logs.

---

## Local Development Setup

### Prerequisites
- Node.js 20 or higher
- PostgreSQL (or Docker)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (or `http://localhost:3000` via Docker).

### 3. Docker Compose Setup (Optional)
To run the full stack (database, backend, and frontend) in containers:
```bash
docker compose up --build -d
```

---

## Testing

Run the automated integration test suite:

```bash
cd backend
npm test
```

Test results:
```text
 PASS src/__tests__/api.test.ts (11 tests) 862ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

---

## License

MIT License.
