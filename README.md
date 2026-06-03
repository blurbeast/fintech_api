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

The API is fully documented using Swagger/OpenAPI. Once the Docker server is running, you can view and interact with the endpoints at:   **http://localhost:3001/api-docs**

*(Note: If you run the Node.js application natively without Docker, it will run on port `3000` instead)*

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
The database migrations are automatically run when the Docker container starts up. The server will be accessible at `http://localhost:3001`.

---

## Postman / API Testing Flow
1. **Register:** `POST /api/auth/register` (Provides `full_name`, `email`, `password`).
2. **Login:** `POST /api/auth/login` (Provides `email`, `password`) -> Receive JWT.
3. **Fund Wallet:** `POST /api/wallet/fund` (Requires Bearer token, `amount`, and `Idempotency-Key` header).
4. **Transfer:** `POST /api/wallet/transfer` (Requires Bearer token, `recipient_email`, `amount`, and `Idempotency-Key` header).
5. **History:** `GET /api/transactions` (Requires Bearer token) to view deposits, transfers, and withdrawals.

---

## Important Concepts

### 1. Idempotency (`Idempotency-Key` header)
Endpoints that mutate balances (Fund, Transfer, Withdraw) require an `Idempotency-Key` header to prevent duplicate processing if a network request drops. For now, **any string value** is accepted. If you send the same key twice, the system returns the cached successful response instead of deducting funds a second time.

### 2. Double-Entry Ledger (Negative Amounts)
Transaction history utilizes signed amounts to represent cash flow direction, eliminating the need for a separate `direction` column:
- `+` (Positive): Funds entering the wallet (`FUND`, `TRANSFER_IN`).
- `-` (Negative): Funds leaving the wallet (`WITHDRAWAL`, `TRANSFER_OUT`).

Because of this, `SUM(amount)` in the ledger will always perfectly equal the wallet's total balance.

---

## Example API Responses

### 1. Register User (`POST /api/auth/register`)
```json
{
  "message": "User registered successfully. Wallet creation is processing.",
  "user": {
    "id": "16a439a8-eb17-43e8-8a61-785486a7ee4d",
    "email": "user@example.com",
    "created_at": "2026-06-03T07:34:46.789Z"
  }
}
```

### 2. Login (`POST /api/auth/login`)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "refreshToken": "f1ded13a783ccc04fd2940564f9..."
}
```

### 3. Get Current User (`GET /api/user/me`)
```json
{
  "user": {
    "id": "16a439a8-eb17-43e8-8a61-785486a7ee4d",
    "email": "user@example.com",
    "created_at": "2026-06-03T07:34:46.789Z"
  },
  "profile": {
    "id": "41c0392a-590f-4b34-ba30-e71ee2121799",
    "userId": "16a439a8-eb17-43e8-8a61-785486a7ee4d",
    "fullName": "string",
    "createdAt": "2026-06-03T07:34:46.789Z"
  },
  "wallet": {
    "id": "cf8591b7-9a42-46bc-96dd-31ea3fb34f6f",
    "userId": "16a439a8-eb17-43e8-8a61-785486a7ee4d",
    "balance": "0",
    "createdAt": "2026-06-03T07:34:48.062Z",
    "updatedAt": "2026-06-03T07:34:48.062Z"
  }
}
```

### 4. Fund Wallet (`POST /api/wallet/fund`)
```json
{
  "message": "Wallet funded successfully",
  "data": {
    "wallet": {
      "id": "fa98ff00-5d9d-4245-a325-3a9ce0c228a3",
      "userId": "ab1ec72b-15a6-45bc-ae27-ed66926bd051",
      "balance": "73456.02",
      "createdAt": "2026-06-02T22:34:08.072Z",
      "updatedAt": "2026-06-03T07:19:36.638Z"
    },
    "reference": "FUND_1780471176600_d50370d3"
  }
}
```

### 5. Transfer Funds (`POST /api/wallet/transfer`)
```json
{
  "message": "Transfer queued successfully",
  "balance": "60456",
  "reference": "TXN_1780472664570_6888ca41"
}
```

### 6. Withdraw Funds (`POST /api/wallet/withdraw`)
```json
{
  "message": "Withdrawal successful",
  "data": {
    "wallet": {
      "id": "fa98ff00-5d9d-4245-a325-3a9ce0c228a3",
      "userId": "ab1ec72b-15a6-45bc-ae27-ed66926bd051",
      "balance": "63456.02",
      "createdAt": "2026-06-02T22:34:08.072Z",
      "updatedAt": "2026-06-03T07:20:30.061Z"
    },
    "reference": "WD_1780471230054_7d727cd0"
  }
}
```

### 7. Transaction History (`GET /api/transactions`)
```json
{
  "transactions": [
    {
      "id": "9c0b4eb3-35eb-4d4a-a213-42ec6292a1cb",
      "walletId": "fa98ff00-5d9d-4245-a325-3a9ce0c228a3",
      "type": "WITHDRAWAL",
      "amount": "-10000",
      "status": "SUCCESS",
      "reference": "WD_1780471230054_7d727cd0",
      "createdAt": "2026-06-03T07:20:32.034Z"
    },
    {
      "id": "c631a34d-ae04-4c92-9ad1-7f3e2eac7f78",
      "walletId": "fa98ff00-5d9d-4245-a325-3a9ce0c228a3",
      "type": "TRANSFER_IN",
      "amount": "500",
      "status": "SUCCESS",
      "reference": "TXN_1780452751508_db5f0350_IN",
      "createdAt": "2026-06-03T02:12:32.044Z"
    },
    {
      "id": "e99ef665-1f9b-42c3-9513-02a54a231eef",
      "walletId": "fa98ff00-5d9d-4245-a325-3a9ce0c228a3",
      "type": "TRANSFER_OUT",
      "amount": "-2000",
      "status": "SUCCESS",
      "reference": "TXN_1780453268599_4c6974b0_OUT",
      "createdAt": "2026-06-03T02:21:10.016Z"
    }
  ]
}
```
