generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Auth ─────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(CUSTOMER)
  createdAt    DateTime @default(now())

  bookedAppointments Appointment[] @relation("BookedBy")
}

enum UserRole {
  ADMIN
  STAFF
  CUSTOMER
}

// ─── Booking domain ───────────────────────────────────────────────────────

model Customer {
  id           String        @id @default(cuid())
  name         String
  phone        String        @unique
  email        String        @unique
  createdAt    DateTime      @default(now())
  appointments Appointment[]
}

model Service {
  id              String        @id @default(cuid())
  name            String
  durationMinutes Int
  price           Float
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  appointments    Appointment[]
}

model Appointment {
  id         String            @id @default(cuid())
  customerId String
  serviceId  String
  bookedById String?           // User who created this booking (null = legacy/seeded)
  startTime  DateTime
  endTime    DateTime
  status     AppointmentStatus @default(scheduled)
  createdAt  DateTime          @default(now())

  customer Customer @relation(fields: [customerId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])
  bookedBy User?    @relation("BookedBy", fields: [bookedById], references: [id])
}

enum AppointmentStatus {
  scheduled
  cancelled
  completed
}
