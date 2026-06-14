const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string({ required_error: "Store name is required" })
    .trim()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be at most 100 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  slug: z
    .string({ required_error: "Slug is required" })
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens (e.g. my-store)"
    ),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
