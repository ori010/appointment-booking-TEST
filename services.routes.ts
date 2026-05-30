import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7, "Phone is required").max(20),
  email: z.string().email("Invalid email address"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
