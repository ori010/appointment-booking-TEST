# appointment-booking-api-typescript

A clean, simple REST API for appointment booking, built with **TypeScript**, **Node.js**, **Express**, **Prisma**, and **SQLite**.

> This project is a simplified public backend demo inspired by a larger private appointment automation system I built. The goal is to demonstrate backend development skills with TypeScript, REST APIs, database modeling, validation, and appointment availability logic.

---

## Tech Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Language     | TypeScript                    |
| Runtime      | Node.js                       |
| Framework    | Express                       |
| ORM          | Prisma                        |
| Database     | SQLite                        |
| Validation   | Zod                           |
| Dev server   | tsx (watch mode)              |

---

## Features

- **Customer management** – create and retrieve customers
- **Service management** – create and retrieve bookable services with duration and price
- **Appointment booking** – book appointments with automatic `endTime` calculation and overlap prevention
- **Appointment cancellation** – cancel scheduled appointments
- **Availability checker** – returns available time slots for a given date and service, based on working hours (09:00–17:00) and existing bookings
- **Zod validation** – all request bodies and query params are validated
- **Centralized error handling** – clean, consistent JSON error responses

---

## Project Structure

```
appointment-booking-api-typescript/
├─ src/
│  ├─ app.ts                        # Express app setup and route registration
│  ├─ server.ts                     # Entry point
│  ├─ routes/                       # Route definitions
│  │  ├─ customers.routes.ts
│  │  ├─ services.routes.ts
│  │  ├─ appointments.routes.ts
│  │  └─ availability.routes.ts
│  ├─ controllers/                  # Request handlers (thin layer)
│  │  ├─ customers.controller.ts
│  │  ├─ services.controller.ts
│  │  ├─ appointments.controller.ts
│  │  └─ availability.controller.ts
│  ├─ services/                     # Business logic
│  │  ├─ customers.service.ts
│  │  ├─ services.service.ts
│  │  ├─ appointments.service.ts
│  │  └─ availability.service.ts
│  ├─ validators/                   # Zod schemas
│  │  ├─ customers.validator.ts
│  │  ├─ services.validator.ts
│  │  ├─ appointments.validator.ts
│  │  └─ availability.validator.ts
│  ├─ middleware/
│  │  ├─ errorHandler.ts            # Centralized error handler
│  │  └─ validateRequest.ts         # Zod validation middleware factory
│  ├─ utils/
│  │  └─ time.ts                    # Slot generation and overlap helpers
│  └─ db/
│     └─ prisma.ts                  # Prisma client singleton
├─ prisma/
│  ├─ schema.prisma                 # Database schema
│  └─ seed.ts                       # Seed script with sample data
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## API Endpoints

### Health

| Method | Path      | Description      |
|--------|-----------|------------------|
| GET    | `/health` | Health check     |

### Customers

| Method | Path              | Description           |
|--------|-------------------|-----------------------|
| GET    | `/customers`      | List all customers    |
| GET    | `/customers/:id`  | Get customer by ID    |
| POST   | `/customers`      | Create a new customer |

### Services

| Method | Path             | Description         |
|--------|------------------|---------------------|
| GET    | `/services`      | List all services   |
| GET    | `/services/:id`  | Get service by ID   |
| POST   | `/services`      | Create a new service|

### Appointments

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/appointments`             | List all appointments    |
| GET    | `/appointments/:id`         | Get appointment by ID    |
| POST   | `/appointments`             | Book a new appointment   |
| PATCH  | `/appointments/:id/cancel`  | Cancel an appointment    |

### Availability

| Method | Path                                          | Description                   |
|--------|-----------------------------------------------|-------------------------------|
| GET    | `/availability?date=YYYY-MM-DD&serviceId=ID`  | Get available slots for a day |

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/appointment-booking-api-typescript.git
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

The default `.env` uses a local SQLite file — no database server needed.

### 4. Set up the database

```bash
npm run db:migrate    # Creates the SQLite database and runs migrations
npm run db:generate   # Generates the Prisma client
```

### 5. (Optional) Seed with sample data

```bash
npm run db:seed
```

This creates 2 customers, 3 services, and 2 appointments for the next day.

### 6. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

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
  -d '{"name": "Deep Clean", "durationMinutes": 60, "price": 50}'
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

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Customer not found"
}
```

Validation errors include a detailed `errors` array:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["email: Invalid email address"]
}
```

---

## Available Scripts

| Script           | Description                              |
|------------------|------------------------------------------|
| `npm run dev`    | Start development server with hot reload |
| `npm run build`  | Compile TypeScript to `dist/`            |
| `npm start`      | Run compiled output                      |
| `npm run db:migrate`  | Run Prisma migrations                |
| `npm run db:generate` | Regenerate Prisma client             |
| `npm run db:seed`     | Seed database with sample data       |
| `npm run db:studio`   | Open Prisma Studio (visual DB UI)    |

---

## Availability Logic

Working hours are fixed at **09:00 – 17:00 UTC**.

1. Generate all possible slots for the day based on the service duration (e.g. a 30-minute service → 09:00, 09:30, 10:00, …, 16:30)
2. Load all `scheduled` appointments for that day from the database
3. Remove any slot that overlaps with an existing appointment
4. Return the remaining slots

Cancelled appointments are ignored. The logic lives in `src/utils/time.ts` and `src/services/availability.service.ts`.

---

## License

MIT
