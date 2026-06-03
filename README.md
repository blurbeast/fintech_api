# Fintech Wallet API

A robust, enterprise-grade wallet API built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication**: JWT-based secure authentication with Argon2 password hashing.
- **Wallet System**: Automatic wallet creation upon user registration.
- **Transactions**: Fund, transfer, and withdraw money securely with ACID-compliant database transactions.
- **Resiliency**: Built-in Idempotency to prevent duplicate payments.
- **Enterprise Architecture**: Uses TSyringe for Dependency Injection and BullMQ/Redis for asynchronous background processing.

## Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Queues:** Redis (via BullMQ)
- **Validation:** Zod

---

## API Documentation (Swagger)

The API is fully documented using Swagger/OpenAPI. Once the server is running, you can view and interact with the endpoints at:   **http://localhost:3000/api-docs**

---

## Setup Instructions

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose installed on your machine.

### 1. Clone and Configure
Clone the repository and copy the environment file:
```bash
cp .env.example .env
```

### 2. Start the Application
The entire application (App, PostgreSQL, Redis) is containerized. Start it with:
```bash
docker compose up -d --build
```

### 3. Database Migrations (Automatic)
The database migrations are automatically run when the Docker container starts up. The server will be accessible at `http://localhost:3000`.

---

## Postman / API Testing Flow
1. **Register:** `POST /api/auth/register` (Provides `full_name`, `email`, `password`).
2. **Login:** `POST /api/auth/login` (Provides `email`, `password`) -> Receive JWT.
3. **Fund Wallet:** `POST /api/wallet/fund` (Requires Bearer token, `amount`, and `Idempotency-Key` header).
4. **Transfer:** `POST /api/wallet/transfer` (Requires Bearer token, `recipient_email`, `amount`, and `Idempotency-Key` header).
5. **History:** `GET /api/transactions` (Requires Bearer token) to view deposits, transfers, and withdrawals.
