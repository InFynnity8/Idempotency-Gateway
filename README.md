# Idempotency Gateway – Pay-Once Protocol

This project implements an **Idempotency Gateway** for a payment processing system built with **NestJS**.  
It guarantees **exactly-once payment execution**, even when clients retry requests due to network timeouts, system failures, or slow responses.

The system prevents **double charging**, safely handles **concurrent duplicate requests**, and enforces **data integrity** using idempotency keys.

---

## 🏗 Architecture Diagram

The Idempotency Gateway sits in front of the payment processor and acts as a protective layer. Every incoming payment request must include a unique `Idempotency-Key`. The gateway determines whether the request should be processed, replayed, blocked, or rejected.

Core components:

- **Client** – Merchant or application sending payment requests
- **Idempotency Gateway (NestJS API)** – Controls request execution
- **Idempotency Store** – Pluggable store (In-Memory for dev, Redis for prod)
- **Audit Log Module** – Records system events for traceability
- **Payment Processor** – Simulates payment execution

![Sequence Diagram Architecture](./assets/Sequence_Diagram_Architecture.png)

---

## ⚙️ Setup Instructions (NestJS)

### Prerequisites

- Node.js **v18 or later**
- npm or yarn

> ⚠️ **Redis is NOT required for local development**  
> The system automatically switches between:
>
> - **In-Memory Store (`Map`)** → Development
> - **Redis** → Production

---

## 🔧 Environment Configuration

Create a `.env` file in the project root.

### Development (Recommended for Local Use)

```env
NODE_ENV=development
USE_IN_MEMORY_STORE=true
```

This configuration:
- Uses an in-memory `Map`
- Requires **no Redis installation**
- Is ideal for Windows / WSL / local testing

---

### Production (Redis-backed)

```env
NODE_ENV=production
REDIS_URL=redis://localhost:6379
```

In production, Redis is used automatically for:
- Cross-instance idempotency guarantees
- Persistence across restarts
- Distributed request coordination

---

## 🧱 Redis Setup (Production Only)

### Option 1: Local Redis

```bash
redis-server
```

Verify:

```bash
redis-cli ping
# PONG
```

---

### Option 2: Redis with Docker (Recommended)

```bash
docker run -d \
  --name redis-idempotency \
  -p 6379:6379 \
  redis:7
```

---

## 📦 Installation

```bash
git clone https://github.com/InFynnity8/Idempotency-Gateway.git
cd idempotency-gateway
npm install
```

---

## ▶️ Running the Application

```bash
npm run start:dev
```

Server starts at:

```
http://localhost:3000
```

---

## 📡 API Documentation

### 1️⃣ Process Payment

**Endpoint**  
`POST /process-payment`

**Headers**

| Header | Required | Description |
|------|---------|-------------|
| `Idempotency-Key` | Yes | Guarantees exactly-once execution |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "amount": 100,
  "currency": "GHS"
}
```

---

#### ✅ First Successful Request

- **Status:** `201 Created`

```json
{
  "message": "Charged 100 GHS"
}
```

---

#### 🔁 Duplicate Request (Same Key & Payload)

- Payment is **not executed again**
- Cached response is replayed

**Response Header**

```
X-Cache-Hit: true
```

---

#### ⚠️ Conflict (Same Key, Different Payload)

- **Status:** `409 Conflict`

```json
{
  "error": "Idempotency key already used for a different request body."
}
```

---

### 2️⃣ Admin: Audit Logs

**Endpoint**  
`GET /admin/audit`

Returns a chronological list of system events recorded during payment processing.

---

#### ✅ Sample Response

- **Status:** `200 OK`

```json
[
  {
    "timestamp": "2026-02-11T23:26:10.409Z",
    "event": "RECEIVED",
    "details": {
      "key": "123456",
      "payload": {
        "amount": 388800,
        "currency": "GHS"
      }
    }
  },
  {
    "timestamp": "2026-02-11T23:26:10.512Z",
    "event": "PROCESSING_STARTED",
    "details": {
      "key": "123456"
    }
  },
  {
    "timestamp": "2026-02-11T23:26:11.001Z",
    "event": "WAITING",
    "details": {
      "key": "123456",
      "reason": "Concurrent request with same idempotency key"
    }
  },
  {
    "timestamp": "2026-02-11T23:26:12.421Z",
    "event": "COMPLETED",
    "details": {
      "key": "123456",
      "response": {
        "message": "Charged 388800 GHS"
      }
    }
  },
  {
    "timestamp": "2026-02-11T23:26:13.104Z",
    "event": "REPLAYED",
    "details": {
      "key": "123456",
      "note": "Cached response returned for duplicate request"
    }
  }
]
```

---

## 🧠 Design Decisions

### Why Idempotency at the API Layer?
Placing idempotency at the gateway level ensures all downstream systems remain stateless and protected from duplicate execution.

### Why Block In-Flight Requests?
Concurrent requests with the same idempotency key are blocked until the first completes, preventing double charges while preserving client correctness.

### Why Request Hashing?
The request body is hashed and stored with the idempotency key to detect accidental or malicious reuse with different payloads.

---

## ⭐ Developer’s Choice: Audit Logging (Major Feature)

### Why This Feature?
In real-world payment systems, **observability and traceability** are just as important as correctness. Audit logging enables:

- Transaction traceability
- Dispute resolution
- Debugging of concurrency issues
- Compliance and reporting readiness

### What Was Implemented

Every significant system event is recorded, including:

- `RECEIVED`
- `PROCESSING_STARTED`
- `WAITING`
- `COMPLETED`
- `REPLAYED`
- `CONFLICT`

Audit logs can be retrieved via the admin endpoint and provide a clear, chronological view of system behavior.

---

## 📌 Summary

This project delivers a **production-oriented idempotency gateway** that provides:

- Exactly-once payment execution
- Safe retries and concurrency handling
- Pluggable storage (Memory → Redis)
- Strong observability via audit logs

It demonstrates modern backend engineering practices suitable for **fintech and distributed systems**.