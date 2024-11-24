import { z } from "zod";

const createValidation = z.object({
  body: z
    .object({
      tripId: z.string({
        required_error: "Trip Id is required",
        invalid_type_error: "Trip Id must be a string",
      }),
      date: z.string({
        required_error: "Date is required",
        invalid_type_error: "Date must be a string",
      }),
      tripStartTime: z.string({
        required_error: "Trip Start Time is required",
        invalid_type_error: "Trip Start Time must be a string",
      }),
      tripEndTime: z.string({
        required_error: "Trip End Time is required",
        invalid_type_error: "Trip End Time must be a string",
      }),
      tripReceipt: z
        .string({
          invalid_type_error: "Trip Receipt must be a string",
        })
        .optional(),
      memo: z
        .string({
          invalid_type_error: "Memo must be a string",
        })
        .optional(),
    })
    .refine(
      (data) => {
        const tripStartDate = new Date(data.tripStartTime);
        const tripEndDate = new Date(data.tripEndTime);

        // Check if tripEndTime is after tripStartTime
        return tripEndDate > tripStartDate;
      },
      {
        message: "Trip End Time must be later than Trip Start Time",
        path: ["body", "tripEndTime"], // The error will point to tripEndTime
      }
    ),
});

const updateValidation = z.object({
  body: z
    .object({
      tripId: z
        .string({
          required_error: "Trip Id is required",
          invalid_type_error: "Trip Id must be a string",
        })
        .optional(),
      date: z
        .string({
          required_error: "Date is required",
          invalid_type_error: "Date must be a string",
        })
        .optional(),
      tripStartTime: z.string({
        required_error: "Trip Start Time is required",
        invalid_type_error: "Trip Start Time must be a string",
      }),
      tripEndTime: z.string({
        required_error: "Trip End Time is required",
        invalid_type_error: "Trip End Time must be a string",
      }),
      tripReceipt: z
        .string({
          invalid_type_error: "Trip Receipt must be a string",
        })
        .optional(),
      memo: z
        .string({
          invalid_type_error: "Memo must be a string",
        })
        .optional(),
    })
    .refine(
      (data) => {
        const tripStartDate = new Date(data.tripStartTime);
        const tripEndDate = new Date(data.tripEndTime);

        // Check if tripEndTime is after tripStartTime
        return tripEndDate > tripStartDate;
      },
      {
        message: "Trip End Time must be later than Trip Start Time",
        path: ["body", "tripEndTime"], // The error will point to tripEndTime
      }
    ),
});

export const TimeSheetValidationSchemas = {
  createValidation,
  updateValidation,
};
