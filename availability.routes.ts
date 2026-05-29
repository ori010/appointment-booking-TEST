import { z } from "zod";

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  serviceId: z.string().min(1, "serviceId is required"),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
