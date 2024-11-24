import { z } from "zod";

const LoginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email(),
    password: z.string({
      required_error: "Password is required",
    }),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
});

const DeleteTables = z.object({
  body: z.object({
    password: z.string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    }),
    individual: z
      .boolean({
        invalid_type_error: "Individual must be a boolean value",
      })
      .optional(),
    role: z
      .boolean({
        invalid_type_error: "Role must be a boolean value",
      })
      .optional(),
    weekend: z
      .boolean({
        invalid_type_error: "Weekend must be a boolean value",
      })
      .optional(),
    roster: z
      .boolean({
        invalid_type_error: "Roster must be a boolean value",
      })
      .optional(),
  }),
});

export const AuthValidationSchemas = {
  LoginUser,
  DeleteTables,
};
