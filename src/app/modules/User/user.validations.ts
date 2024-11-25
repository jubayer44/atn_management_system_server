import { z } from "zod";

const createValidation = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    }),
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
      })
      .email(),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters long")
      .max(40, "Password must not exceed 40 characters"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be USER or ADMIN",
    }),
    status: z
      .enum(["ACTIVE", "BLOCKED"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be ACTIVE or BLOCKED",
      })
      .optional(),
  }),
});

const updateValidation = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: "Name must be a string",
      })
      .optional(),
    password: z
      .string({
        invalid_type_error: "Password must be a string",
      })
      .min(6, "Password must be at least 8 characters long")
      .max(20, "Password must not exceed 20 characters")
      .optional(),
    role: z
      .enum(["SUPER_ADMIN", "ADMIN", "USER"], {
        invalid_type_error: "Role must be USER or ADMIN",
      })
      .optional(),
    status: z
      .enum(["ACTIVE", "BLOCKED"], {
        invalid_type_error: "Status must be ACTIVE or BLOCKED",
      })
      .optional(),
  }),
});

const updateUserName = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    }),
  }),
});

const deleteMultipleUser = z.object({
  body: z.object({
    ids: z.array(
      z.string({
        required_error: "Ids is required",
        invalid_type_error: "Ids must be an array of strings",
      })
    ),
  }),
});

export const UserValidationSchemas = {
  createValidation,
  updateValidation,
  updateUserName,
  deleteMultipleUser,
};
