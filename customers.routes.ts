import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z
    .enum(["ADMIN", "STAFF", "CUSTOMER"], {
      errorMap: () => ({ message: "Role must be ADMIN, STAFF or CUSTOMER" }),
    })
    .optional()
    .default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
