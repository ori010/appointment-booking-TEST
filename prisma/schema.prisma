// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

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
  startTime  DateTime
  endTime    DateTime
  status     AppointmentStatus @default(scheduled)
  createdAt  DateTime          @default(now())

  customer Customer @relation(fields: [customerId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])
}

enum AppointmentStatus {
  scheduled
  cancelled
  completed
}
