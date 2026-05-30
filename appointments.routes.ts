import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  durationMinutes: z
    .number({ invalid_type_error: "durationMinutes must be a number" })
    .int()
    .min(5, "Duration must be at least 5 minutes"),
  price: z
    .number({ invalid_type_error: "price must be a number" })
    .min(0, "Price must be zero or greater"),
  isActive: z.boolean().optional().default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
