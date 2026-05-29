import prisma from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateAppointmentInput } from "../validators/appointments.validator";

// Mirrors the Prisma enum – kept as a const so it's type-safe without
// requiring the generated client at compile time.
const AppointmentStatus = {
  scheduled: "scheduled",
  cancelled: "cancelled",
  completed: "completed",
} as const;
type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export async function getAllAppointments() {
  return prisma.appointment.findMany({
    include: { customer: true, service: true },
    orderBy: { startTime: "asc" },
  });
}

export async function getAppointmentById(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: true, service: true },
  });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return appointment;
}

/** Returns true if a UTC time (hour + minute) is outside working hours 09:00–17:00. */
function isOutsideWorkingHours(hour: number, minute: number): boolean {
  const totalMinutes = hour * 60 + minute;
  return totalMinutes < 9 * 60 || totalMinutes > 17 * 60;
}

export async function createAppointment(data: CreateAppointmentInput) {
  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) throw new AppError("Customer not found", 404);

  // Validate service exists and is active
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  if (!service) throw new AppError("Service not found", 404);
  if (!service.isActive) throw new AppError("Service is not currently active", 400);

  // Calculate times
  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

  // Enforce working hours: startTime must be within 09:00–17:00 UTC
  if (isOutsideWorkingHours(startTime.getUTCHours(), startTime.getUTCMinutes())) {
    throw new AppError(
      "Appointment must start between 09:00 and 17:00 UTC",
      400
    );
  }

  // endTime must not exceed 17:00 UTC
  const endTotalMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
  if (endTotalMinutes > 17 * 60) {
    throw new AppError(
      "Appointment would end after working hours (17:00 UTC). Please choose an earlier slot.",
      400
    );
  }

  // Prevent overlapping scheduled appointments
  const overlap = await prisma.appointment.findFirst({
    where: {
      status: AppointmentStatus.scheduled,
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (overlap) {
    throw new AppError("This time slot overlaps with an existing appointment", 409);
  }

  return prisma.appointment.create({
    data: {
      customerId: data.customerId,
      serviceId: data.serviceId,
      startTime,
      endTime,
      status: AppointmentStatus.scheduled,
    },
    include: { customer: true, service: true },
  });
}

export async function cancelAppointment(id: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError("Appointment not found", 404);

  if (appointment.status === AppointmentStatus.cancelled) {
    throw new AppError("Appointment is already cancelled", 400);
  }

  if (appointment.status === AppointmentStatus.completed) {
    throw new AppError("Cannot cancel a completed appointment", 400);
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.cancelled },
    include: { customer: true, service: true },
  });
}
