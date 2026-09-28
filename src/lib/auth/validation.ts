import { z } from "zod";

// Username/password rules are intentionally simple for an MVP but not lax:
// server-side validation always runs regardless of what the client checked
// (spec 35: "server-side validation").
export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  displayName: z.string().trim().min(1, "Display name is required").max(50),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
