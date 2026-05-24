import prisma from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { generateDaySlots, slotsOverlap } from "../utils/time";
import { AvailabilityQuery } from "../validators/availability.validator";

const AppointmentStatus = {
  scheduled: "scheduled",
  cancelled: "cancelled",
  completed: "completed",
} as const;

export async function getAvailableSlots(query: AvailabilityQuery) {
  const { date, serviceId } = query;

  // Validate service exists and is active
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AppError("Service not found", 404);
  if (!service.isActive) throw new AppError("Service is not currently active", 400);

  // Generate all possible slots for the day
  const allSlots = generateDaySlots(date, service.durationMinutes);

  // Load scheduled appointments for the day
  const [year, month, day] = date.split("-").map(Number);
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.scheduled,
      startTime: { gte: dayStart, lte: dayEnd },
    },
  });

  // Filter out slots that overlap with booked appointments
  const availableSlots = allSlots.filter((slot) => {
    return !bookedAppointments.some((appt: { startTime: Date; endTime: Date }) =>
      slotsOverlap(slot.start, slot.end, appt.startTime, appt.endTime)
    );
  });

  return {
    date,
    serviceId,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    availableSlots: availableSlots.map((slot) => ({
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    })),
  };
}
