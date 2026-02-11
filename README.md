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
- **Idempotency Store (Redis)** – Stores request state, hashes, responses, and TTL
- **Audit Log Module** – Records system events for traceability
- **Payment Processor** – Simulates payment execution

![Sequence Diagram Architecture](./assets/Sequence_Diagram_Architecture.png)

---

## ⚙️ Setup Instructions (NestJS)

### Prerequisites

- Node.js **v18 or later**
- npm or yarn
- **Redis (required)** – used as the idempotency store

---

### Redis Configuration

This project **requires Redis** to function correctly. Redis is used to:

- Store idempotency keys
- Track request state (`IN_PROGRESS`, `COMPLETED`)
- Cache responses for replay
- Automatically expire keys using TTL

#### Option 1: Run Redis Locally

If Redis is installed locally:

```bash
redis-server
```

Verify Redis is running:

```bash
redis-cli ping
```

Expected output:

```
PONG
```

Redis will run on the default address:

```
redis://localhost:6379
```

---

#### Option 2: Run Redis with Docker (Recommended)

If Redis is not installed locally, run it using Docker:

```bash
docker run -d \
  --name redis-idempotency \
  -p 6379:6379 \
  redis:7
```

This exposes Redis on:

```
redis://localhost:6379
```

---

### Installation

```bash
git https://github.com/InFynnity8/Idempotency-Gateway.git
cd idempotency-gateway
npm install
```

---

### Running the Application

```bash
npm run start:dev
```

The server will start on:

```
http://localhost:3000
```

---

## 📡 API Documentation

### Endpoint: Process Payment

**URL**  
`POST /process-payment`

**Headers**

| Header | Required | Description |
|------|---------|-------------|
| `Idempotency-Key` | Yes | Unique key to guarantee exactly-once execution |
| `Content-Type` | Yes | Must be `application/json` |

**Request Body**

```json
{
  "amount": 100,
  "currency": "GHS"
}
```

---

### Successful First Request

- **Status:** `201 Created`

```json
{
  "message": "Charged 100 GHS"
}
```

---

### Duplicate Request (Same Key & Payload)

If the same request is retried with the same `Idempotency-Key` and payload:

- Payment is **not processed again**
- Cached response is returned immediately

**Response Header**

```
X-Cache-Hit: true
```

---

### Conflict: Same Key, Different Payload

- **Status:** `409 Conflict`

```json
{
  "error": "Idempotency key already used for a different request body."
}
```

---

## 🧠 Design Decisions

### Why Idempotency at the API Layer?
Placing idempotency at the gateway level ensures all downstream systems remain stateless and protected from duplicate execution.

### Why Block In-Flight Requests?
When identical requests arrive concurrently, the system blocks the second request until the first completes. This avoids double execution while preserving a consistent client experience.

### Why Request Hashing?
The request body is hashed and stored alongside the idempotency key to detect malicious or accidental reuse of the same key with different payloads.

### Why Redis with TTL?
Redis provides:

- Fast lookups for concurrent requests
- Native TTL support for automatic key expiration
- Reliability suitable for distributed systems

This makes it ideal for implementing idempotency in payment workflows.

---

## ⭐ Developer’s Choice: Idempotency TTL & Audit Logging

### Why This Feature?
Real-world fintech systems cannot retain idempotency keys indefinitely. Unlimited retention increases storage costs, replay risk, and compliance complexity. Additionally, payment systems require detailed audit trails for dispute resolution and regulatory oversight.

### What Was Implemented

#### 1. Idempotency Key Expiry (TTL)
- Each idempotency key has a configurable TTL
- Expired keys are automatically removed by Redis
- Prevents stale replays and unbounded storage growth

#### 2. Audit Logging
Every important system event is recorded, including:

- `RECEIVED`
- `PROCESSING_STARTED`
- `COMPLETED`
- `REPLAYED`
- `WAITING`
- `CONFLICT`

Audit logs enable transaction traceability, debugging, and compliance reporting.

---

## 📌 Summary

This system guarantees:

- Exactly-once payment execution
- Safe retries and concurrency handling
- Strong data integrity guarantees
- Observability suitable for fintech compliance

The result is a **production-oriented idempotency gateway** built with NestJS and modern backend engineering principles.

