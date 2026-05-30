# appointment-booking-api

[![CI](https://github.com/ori010/appointment-booking-api-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/ori010/appointment-booking-api-typescript/actions/workflows/ci.yml)

A production-style appointment booking REST API built with **TypeScript**, **Node.js**, **Express**, **Prisma**, **Zod** and **Vitest**.

> This project is a public backend demo inspired by a larger private appointment automation system I built for real businesses. It is designed to demonstrate clean backend architecture, business logic, data modeling, validation, and testing — the kinds of skills evaluated in backend engineering interviews.

---

## What This Project Demonstrates

- **Clean TypeScript backend architecture** — routes → controllers → services, with strict types throughout
- **REST API design** — consistent request/response shapes, proper HTTP status codes, and meaningful error messages
- **Prisma ORM and data modeling** — relational schema with Customer, Service and Appointment entities
- **Zod validation** — all inputs validated at the boundary before reaching business logic
- **Business logic in services** — controllers stay thin; all rules live in the service layer
- **Appointment availability calculation** — slot generation based on working hours and service duration
- **Booking conflict prevention** — overlap detection using database queries before any write
- **Unit tests with Vitest** — 33 tests covering pure functions, service logic, and edge cases; Prisma is fully mocked
- **Centralized error handling** — single Express error middleware handles Zod errors, AppErrors, and unexpected failures uniformly
- **CI-ready project structure** — builds cleanly, tests run without a database, ready for GitHub Actions

---

## Tech Stack

| Layer        | Technology            |
|--------------|-----------------------|
| Language     | TypeScript            |
| Runtime      | Node.js 18+           |
| Framework    | Express               |
| ORM          | Prisma                |
| Database     | SQLite                |
| Validation   | Zod                   |
| Testing      | Vitest                |
| Dev server   | tsx (watch mode)      |

---

## Features

- **Customer management** — create and retrieve customers; duplicate phone/email rejected
- **Service management** — create services with name, duration (minutes) and price; mark inactive
- **Appointment booking** — validates customer, service, working-hours window, and prevents overlapping slots
- **Appointment cancellation** — cancel any scheduled appointment; completed appointments are protected
- **Availability checker** — returns free ISO 8601 time slots for a given date and service, filtered against existing bookings
- **Zod request validation** — body and query params validated before any handler runs
- **Centralized error responses** — every error returns `{ success: false, message: "..." }`
- **Seed script** — populate the database with sample data in one command

---

## Architecture

```
src/
├── app.ts               # Express setup, middleware, route mounting
├── server.ts            # Entry point — reads PORT, starts listening
│
├── routes/              # Route definitions only — no logic
├── controllers/         # Parse request, call service, return response
├── services/            # All business logic lives here
├── validators/          # Zod schemas for each domain
├── middleware/
│   ├── errorHandler.ts  # Centralized error handler (last middleware)
│   └── validateRequest.ts  # Reusable Zod validation factory
├── utils/
│   └── time.ts          # Pure functions: slot generation and overlap check
├── db/
│   └── prisma.ts        # Prisma client singleton
└── __tests__/           # Unit tests — no database required
```

**Request lifecycle:**
```
HTTP Request
  → validate middleware (Zod)
  → controller (parse params, call service)
  → service (business logic, DB queries via Prisma)
  → controller (format response)
  → errorHandler middleware (catches any thrown AppError or ZodError)
```

---

## API Endpoints

### Auth

| Method | Path               | Auth required | Description                        |
|--------|--------------------|---------------|------------------------------------|
| POST   | `/auth/register`   | No            | Create account, receive JWT token  |
| POST   | `/auth/login`      | No            | Log in, receive JWT token          |
| GET    | `/auth/me`         | ✅ Bearer     | Get current user profile           |

### Health

| Method | Path      | Description  |
|--------|-----------|--------------|
| GET    | `/health` | No  | Health check |
| GET    | `/docs`   | No  | Swagger UI — interactive API documentation |

### Customers

| Method | Path             | Description           |
|--------|------------------|-----------------------|
| GET    | `/customers`     | List all customers    |
| GET    | `/customers/:id` | Get customer by ID    |
| POST   | `/customers`     | Create a new customer |

### Services

| Method | Path            | Description          |
|--------|-----------------|----------------------|
| GET    | `/services`     | List all services    |
| GET    | `/services/:id` | Get service by ID    |
| POST   | `/services`     | Create a new service |

### Appointments

| Method | Path                       | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/appointments`            | List all appointments    |
| GET    | `/appointments/:id`        | Get appointment by ID    |
| POST   | `/appointments`            | Book a new appointment   |
| PATCH  | `/appointments/:id/cancel` | Cancel an appointment    |

### Availability

| Method | Path                                         | Description                   |
|--------|----------------------------------------------|-------------------------------|
| GET    | `/availability?date=YYYY-MM-DD&serviceId=ID` | List available slots for a day |

---

## API Documentation

The API ships with interactive **Swagger UI** documentation powered by the [OpenAPI 3.0](https://swagger.io/specification/) spec.

After starting the server, open:

```
http://localhost:3000/docs
```

Every endpoint is documented with:
- Request body schema and field constraints
- Query parameter descriptions
- All possible response shapes and status codes
- Inline examples for requests and responses

The spec lives in `src/docs/openapi.ts` as a typed TypeScript object — no scattered JSDoc comments.

---

## Authentication

The API uses **JWT Bearer token** authentication. Obtain a token by calling `POST /auth/register` or `POST /auth/login`, then pass it in the `Authorization` header on protected requests.

### Roles

| Role       | Permissions                                                             |
|------------|-------------------------------------------------------------------------|
| `ADMIN`    | Full access — manage services, view all customers and appointments, cancel any appointment |
| `STAFF`    | View customers and appointments                                         |
| `CUSTOMER` | Book appointments, cancel their own appointments                        |

### Register and log in

```bash
# Register a new customer account
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "securepassword"}'

# Log in with an existing account
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin1234"}'
```

Both responses return:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "name": "Admin User", "email": "admin@example.com", "role": "ADMIN" }
  }
}
```

### Calling protected endpoints

Pass the token in the `Authorization` header:

```bash
export TOKEN="eyJhbGci..."

# View all appointments (ADMIN or STAFF only)
curl http://localhost:3000/appointments \
  -H "Authorization: Bearer $TOKEN"

# Book an appointment (CUSTOMER or ADMIN)
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "<id>", "serviceId": "<id>", "startTime": "2024-06-15T10:00:00.000Z"}'

# Cancel your own appointment (CUSTOMER)
curl -X PATCH http://localhost:3000/appointments/<id>/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### Demo accounts (after running `npm run db:seed`)

| Role       | Email                 | Password     |
|------------|-----------------------|--------------|
| `ADMIN`    | admin@example.com     | admin1234    |
| `STAFF`    | staff@example.com     | staff1234    |
| `CUSTOMER` | alice@example.com     | alice1234    |

> These are for local development only. Never use them in production.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/ori010/appointment-booking-api-typescript.git
cd appointment-booking-api-typescript
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

### 4. Set up the database

```bash
npm run db:migrate    # Creates the SQLite database and applies migrations
npm run db:generate   # Generates the Prisma client
```

### 5. (Optional) Seed sample data

```bash
npm run db:seed
```

Inserts 2 customers, 3 services, and 2 appointments scheduled for the next day.

### 6. Start the development server

```bash
npm run dev
```

API available at `http://localhost:3000`.

---

## Environment Variables

All variables are documented in `.env.example`. Copy it to `.env` before running locally — never commit `.env`.

| Variable       | Default            | Description                      |
|----------------|--------------------|----------------------------------|
| `DATABASE_URL` | `file:./dev.db`    | Prisma connection string (SQLite) |
| `PORT`         | `3000`             | Port the HTTP server listens on  |
| `JWT_SECRET`   | *(set this)*       | Secret used to sign JWT tokens — use `openssl rand -hex 64` in production |

---

## Running Tests

```bash
npm test
```

```
✓ src/__tests__/time.test.ts                  (16 tests)
✓ src/__tests__/appointments.service.test.ts  (17 tests)
✓ src/__tests__/auth.service.test.ts          (11 tests)
✓ src/__tests__/availability.service.test.ts  ( 7 tests)
✓ src/__tests__/requireAuth.test.ts           ( 5 tests)
✓ src/__tests__/requireRole.test.ts           ( 6 tests)

Test Files  6 passed (6)
Tests      62 passed (62)
```

Tests use [Vitest](https://vitest.dev/) and mock Prisma with `vi.mock` — **no database or running server required**.

```bash
npm run test:watch   # re-runs on file save during development
```

---

## Example Requests

### Health check

```bash
curl http://localhost:3000/health
```

```json
{ "success": true, "message": "API is running" }
```

### Create a customer

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "phone": "+1-555-9999", "email": "jane@example.com"}'
```

```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "name": "Jane Doe",
    "phone": "+1-555-9999",
    "email": "jane@example.com",
    "createdAt": "2024-06-01T10:00:00.000Z"
  }
}
```

### Create a service

```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -d '{"name": "Haircut", "durationMinutes": 30, "price": 25}'
```

### Check availability

```bash
curl "http://localhost:3000/availability?date=2024-06-15&serviceId=<serviceId>"
```

```json
{
  "success": true,
  "data": {
    "date": "2024-06-15",
    "serviceId": "clxyz456",
    "serviceName": "Haircut",
    "durationMinutes": 30,
    "availableSlots": [
      { "startTime": "2024-06-15T09:00:00.000Z", "endTime": "2024-06-15T09:30:00.000Z" },
      { "startTime": "2024-06-15T09:30:00.000Z", "endTime": "2024-06-15T10:00:00.000Z" }
    ]
  }
}
```

### Book an appointment

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "<customerId>",
    "serviceId": "<serviceId>",
    "startTime": "2024-06-15T09:00:00.000Z"
  }'
```

### Cancel an appointment

```bash
curl -X PATCH http://localhost:3000/appointments/<id>/cancel
```

---

## Error Responses

All errors return a consistent structure:

```json
{ "success": false, "message": "Customer not found" }
```

Validation errors include a details array:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["email: Invalid email address"]
}
```

---

## Appointment Rules

- `startTime` must be within working hours **09:00 – 17:00 UTC**
- `endTime` (calculated from service duration) must not exceed **17:00 UTC**
- A new appointment cannot overlap any existing `scheduled` appointment
- `cancelled` appointments are excluded from all overlap and availability checks

---

## Availability Logic

Working hours are fixed at **09:00 – 17:00 UTC** (configurable working hours planned in a future phase).

1. Generate all possible time slots for the day based on service duration
   - e.g. 30 min service → 09:00, 09:30, 10:00, …, 16:30
2. Load all `scheduled` appointments for that day from the database
3. Remove any slot that overlaps with an existing appointment
4. Return the remaining slots as ISO 8601 datetime strings

The pure slot-generation and overlap logic lives in `src/utils/time.ts` and is independently unit-tested.

---

## Available Scripts

| Script               | Description                             |
|----------------------|-----------------------------------------|
| `npm run dev`        | Start dev server with hot reload        |
| `npm run build`      | Compile TypeScript to `dist/`           |
| `npm start`          | Run compiled output                     |
| `npm test`           | Run all tests (no DB required)          |
| `npm run test:watch` | Re-run tests on save                    |
| `npm run db:migrate` | Run Prisma migrations                   |
| `npm run db:generate`| Regenerate Prisma client                |
| `npm run db:seed`    | Seed database with sample data          |
| `npm run db:studio`  | Open Prisma Studio (visual DB browser)  |

---

## Continuous Integration

This project includes a [GitHub Actions](.github/workflows/ci.yml) CI pipeline that runs automatically on every push and pull request.

The pipeline:
1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Generates the Prisma client
5. Builds TypeScript (`npm run build`)
6. Runs all tests (`npm test`)

This ensures the project always builds cleanly and all tests pass before any change is merged.

---

## Running with Docker

The project includes a `Dockerfile` (multi-stage build) and `docker-compose.yml` for a fully self-contained local setup — no Node.js installation required.

### Quick start

```bash
docker compose up --build
```

That single command will:
1. Build the image (compile TypeScript in a `builder` stage, copy output to a lean `production` stage)
2. Run `prisma migrate deploy` to create the SQLite database
3. Start the API on `http://localhost:3000`

The SQLite file is stored in a named Docker volume (`db_data`) so your data survives container restarts.

### Useful Docker commands

```bash
# Start in the background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and delete the database volume (full reset)
docker compose down -v

# Seed sample data inside the running container
docker compose exec api npx tsx prisma/seed.ts
```

### How the image is structured

The `Dockerfile` uses a two-stage build:

| Stage        | Purpose                                                      |
|--------------|--------------------------------------------------------------|
| `builder`    | Installs all deps, generates Prisma client, compiles TS      |
| `production` | Copies only compiled `dist/`, installs production deps only  |

This keeps the final image small and free of TypeScript tooling.

> **Local npm workflow is unchanged.** Docker is an optional alternative — `npm run dev` and `npm test` still work exactly as before.

---

## Future Improvements

Planned phases for this project:

- ~~**CI**~~ — ✅ GitHub Actions pipeline (`.github/workflows/ci.yml`)
- ~~**Swagger / OpenAPI**~~ — ✅ Swagger UI available at `/docs` (`src/docs/openapi.ts`)
- ~~**Docker**~~ — ✅ `Dockerfile` + `docker-compose.yml` (multi-stage build, SQLite volume)
- ~~**Authentication**~~ — ✅ JWT auth, bcrypt passwords, requireAuth + requireRole middleware, 3 roles
- **Business & Staff model** — per-staff availability and overlap checking
- **Configurable working hours** — replace fixed 09:00–17:00 with DB-driven schedule per business/staff
- **Appointment lifecycle** — reschedule, complete, no-show statuses
- **Integration tests** — Supertest end-to-end coverage against a test database
- **Deployment** — Render/Railway deployment with live API URL

---

## License

MIT
