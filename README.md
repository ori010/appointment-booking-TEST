# appointment-booking-api-typescript

A clean, simple REST API for appointment booking, built with **TypeScript**, **Node.js**, **Express**, **Prisma**, and **SQLite**.

> This project is a simplified public backend demo inspired by a larger private appointment automation system I built. The goal is to demonstrate backend development skills with TypeScript, REST APIs, database modeling, validation, and appointment availability logic.

---

## Tech Stack

| Layer       | Technology          |
|-------------|---------------------|
| Language    | TypeScript          |
| Runtime     | Node.js             |
| Framework   | Express             |
| ORM         | Prisma              |
| Database    | SQLite              |
| Validation  | Zod                 |
| Testing     | Vitest              |
| Dev server  | tsx (watch mode)    |

---

## Features

- **Customer management** – create and retrieve customers
- **Service management** – create and retrieve bookable services with duration and price
- **Appointment booking** – validates customer, service, working hours, and prevents time-slot overlaps
- **Appointment cancellation** – cancel any scheduled appointment
- **Availability checker** – returns free time slots for a given date and service, based on working hours (09:00–17:00 UTC) and existing bookings
- **Zod validation** – all request bodies and query params are validated before reaching business logic
- **Centralized error handling** – consistent JSON error responses across the entire API
- **Unit tests** – 33 tests covering slot generation, overlap logic, working-hours enforcement, and availability filtering

---

## Project Structure

```
appointment-booking-api-typescript/
├─ src/
│  ├─ app.ts                         # Express app setup and route registration
│  ├─ server.ts                      # Entry point
│  ├─ routes/
│  │  ├─ customers.routes.ts
│  │  ├─ services.routes.ts
│  │  ├─ appointments.routes.ts
│  │  └─ availability.routes.ts
│  ├─ controllers/                   # Thin request handlers – call service, return response
│  │  ├─ customers.controller.ts
│  │  ├─ services.controller.ts
│  │  ├─ appointments.controller.ts
│  │  └─ availability.controller.ts
│  ├─ services/                      # Business logic
│  │  ├─ customers.service.ts
│  │  ├─ services.service.ts
│  │  ├─ appointments.service.ts
│  │  └─ availability.service.ts
│  ├─ validators/                    # Zod schemas
│  │  ├─ customers.validator.ts
│  │  ├─ services.validator.ts
│  │  ├─ appointments.validator.ts
│  │  └─ availability.validator.ts
│  ├─ middleware/
│  │  ├─ errorHandler.ts             # Centralized error handler
│  │  └─ validateRequest.ts          # Reusable Zod validation middleware factory
│  ├─ utils/
│  │  └─ time.ts                     # Slot generation and overlap helpers
│  ├─ db/
│  │  └─ prisma.ts                   # Prisma client singleton
│  └─ __tests__/
│     ├─ time.test.ts                # generateDaySlots + slotsOverlap (16 tests)
│     ├─ appointments.service.test.ts# Overlap detection + working hours (10 tests)
│     └─ availability.service.test.ts# Slot filtering + edge cases (7 tests)
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## API Endpoints

### Health

| Method | Path      | Description  |
|--------|-----------|--------------|
| GET    | `/health` | Health check |

### Customers

| Method | Path             | Description            |
|--------|------------------|------------------------|
| GET    | `/customers`     | List all customers     |
| GET    | `/customers/:id` | Get a customer by ID   |
| POST   | `/customers`     | Create a new customer  |

### Services

| Method | Path            | Description           |
|--------|-----------------|-----------------------|
| GET    | `/services`     | List all services     |
| GET    | `/services/:id` | Get a service by ID   |
| POST   | `/services`     | Create a new service  |

### Appointments

| Method | Path                       | Description               |
|--------|----------------------------|---------------------------|
| GET    | `/appointments`            | List all appointments     |
| GET    | `/appointments/:id`        | Get an appointment by ID  |
| POST   | `/appointments`            | Book a new appointment    |
| PATCH  | `/appointments/:id/cancel` | Cancel an appointment     |

### Availability

| Method | Path                                         | Description                    |
|--------|----------------------------------------------|--------------------------------|
| GET    | `/availability?date=YYYY-MM-DD&serviceId=ID` | Get free slots for a given day |

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/ori010/appointment-booking-TEST.git
cd appointment-booking-TEST
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

The default `.env` uses a local SQLite file — no external database needed.

### 4. Set up the database

```bash
npm run db:migrate    # Creates the SQLite database and runs migrations
npm run db:generate   # Generates the Prisma client
```

### 5. (Optional) Seed sample data

```bash
npm run db:seed
```

Creates 2 customers, 3 services, and 2 appointments scheduled for the next day.

### 6. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## Running Tests

```bash
npm test
```

```
✓ src/__tests__/time.test.ts                  (16 tests)
✓ src/__tests__/appointments.service.test.ts  (10 tests)
✓ src/__tests__/availability.service.test.ts  (7 tests)

Test Files  3 passed (3)
Tests       33 passed (33)
```

Tests use [Vitest](https://vitest.dev/) and mock Prisma with `vi.mock` — no database required to run them.

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
curl -X PATCH http://localhost:3000/appointments/<appointmentId>/cancel
```

---

## Error Response Format

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

- `startTime` must be between **09:00 and 17:00 UTC**
- `endTime` (calculated automatically from the service duration) must not exceed **17:00 UTC**
- Appointments cannot overlap with any other `scheduled` appointment
- `cancelled` appointments are ignored in all overlap and availability checks

---

## Availability Logic

Working hours are fixed at **09:00 – 17:00 UTC**.

1. Generate all possible slots for the day based on service duration (e.g. 30 min → 09:00, 09:30, …, 16:30)
2. Load all `scheduled` appointments for that day
3. Remove any slot that overlaps with an existing appointment
4. Return the remaining slots as ISO 8601 datetime strings

The logic lives in `src/utils/time.ts` (pure functions, fully tested) and `src/services/availability.service.ts`.

---

## Available Scripts

| Script              | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start dev server with hot reload         |
| `npm run build`     | Compile TypeScript to `dist/`            |
| `npm start`         | Run compiled output                      |
| `npm test`          | Run all tests                            |
| `npm run test:watch`| Run tests in watch mode                  |
| `npm run db:migrate`| Run Prisma migrations                    |
| `npm run db:generate`| Regenerate Prisma client               |
| `npm run db:seed`   | Seed sample data                         |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)   |

---

## License

MIT
