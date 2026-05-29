import { z } from "zod";

export const createAppointmentSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
  serviceId: z.string().min(1, "serviceId is required"),
  startTime: z
    .string()
    .datetime({ message: "startTime must be a valid ISO 8601 datetime" }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
