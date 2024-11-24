import { Prisma, Time_Sheet } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { JwtPayload } from "jsonwebtoken";
import {
  DurationInNumberAndAmount,
  getTimeDuration,
  isTimeSheetAlreadyExists,
  isTimeSheetExists,
} from "./timeSheet.utils";
import { paginationHelpers } from "../../../helpers/paginationHelpers";
import { isUserExists } from "../User/user.utils";
import { Decimal } from "@prisma/client/runtime/library";

const createTimeSheetIntoDB = async (
  payload: Time_Sheet,
  userData: JwtPayload
) => {
  const user = await isUserExists(userData.id);

  const durationAndPayment = DurationInNumberAndAmount(
    payload,
    user.hourlyRate
  );

  const tripData = {
    ...payload,
    name: user.name,
    date: new Date(payload.date),
    tripStartTime: new Date(payload.tripStartTime),
    tripEndTime: new Date(payload.tripEndTime),
    duration: getTimeDuration(payload),
    durationInNumber: new Decimal(durationAndPayment.durationNumber),
    payment: new Decimal(durationAndPayment.tripAmount),
    userId: user.id,
  };

  await isTimeSheetAlreadyExists(tripData);

  const result = await prisma.time_Sheet.create({
    data: tripData,
  });
  return result;
};

const getAllTimeSheetsFromDB = async (filtersField: any, options: any) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, startDate, endDate } = filtersField;

  const andConditions: Prisma.Time_SheetWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "tripId"]?.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Handle date filtering
  if (startDate && !endDate) {
    // Convert the provided date string to a Date object
    const targetDate = new Date(startDate);

    // Normalize the targetDate to midnight (00:00:00) for accurate comparison
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // Start of the day (00:00:00)
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // End of the day (23:59:59.999)

    // Add date range condition (from 00:00:00 to 23:59:59.999 of the target date)
    andConditions.push({
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  }

  // Handle date range filtering when both startDate and endDate are provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize both dates to start and end of the respective days
    const startOfDay = new Date(start.setHours(0, 0, 0, 0)); // Start of the startDate
    const endOfDay = new Date(end.setHours(23, 59, 59, 999)); // End of the endDate

    andConditions.push({
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  }

  const whereConditions: Prisma.Time_SheetWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.time_Sheet.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: options.sortOrder || "desc",
    },
  });

  const totalData = await prisma.time_Sheet.count({
    where: whereConditions,
  });

  const totalPayment = await prisma.time_Sheet.aggregate({
    _sum: {
      payment: true,
    },
    where: whereConditions, // Make sure whereConditions is defined correctly
  });

  return {
    meta: {
      total: totalData,
      page,
      limit,
    },
    data: { trips: result, totalPayment },
  };
};

const updateTimeSheetIntoDB = async (id: string, payload: any) => {
  // Check if the trip exists
  const trip = await isTimeSheetExists(id);

  const currentDate = new Date();
  const timePassed = currentDate.getTime() - new Date(trip.createdAt).getTime();

  // If more than 24 hours have passed, deny the update
  if (timePassed > 24 * 60 * 60 * 1000) {
    // 24 hours in milliseconds
    throw new Error("You cannot update the trip after 24 hours.");
  }

  const updatePayload = {
    tripId: payload.tripId || trip.tripId,
    date: new Date(payload.date) || trip.date,
    tripStartTime: new Date(payload.tripStartTime) || trip.tripStartTime,
    tripEndTime: new Date(payload.tripEndTime) || trip.tripEndTime,
    tripReceipt: payload.tripReceipt || trip.tripReceipt,
    memo: payload.memo || trip.memo,
  };

  const { tripId, date, tripStartTime, tripEndTime } = payload;

  // Step 1: Check if the tripId already exists (except for the current record being updated)
  if (tripId) {
    const tripIdExists = await prisma.time_Sheet.findFirst({
      where: {
        tripId,
        NOT: {
          id, // Exclude the current time sheet being updated
        },
      },
    });

    if (tripIdExists) {
      throw new Error(
        "Duplicate tripId found. A time sheet with the same tripId already exists."
      );
    }
  }

  // Step 2: Check for overlapping times (if tripStartTime and tripEndTime are provided)
  if (tripStartTime || tripEndTime) {
    // If only one time is provided (either tripStartTime or tripEndTime), we don't need to check for overlap
    // But if both are provided, we will check for overlaps in existing records

    if (tripStartTime && tripEndTime) {
      const existingOverlappingTimes = await prisma.time_Sheet.findFirst({
        where: {
          date: new Date(date),
          AND: [
            {
              tripStartTime: {
                lt: updatePayload.tripEndTime, // Start time is before the new end time
              },
            },
            {
              tripEndTime: {
                gt: updatePayload.tripStartTime, // End time is after the new start time
              },
            },
          ],
          NOT: {
            tripId: trip.tripId, // Exclude the current time sheet being updated
          },
        },
      });

      if (existingOverlappingTimes) {
        throw new Error(
          "The trip start and end times overlap with another time sheet for the same date."
        );
      }
    }
  }

  // Step 3: Proceed with the update if no conflicts
  const result = await prisma.time_Sheet.update({
    where: {
      id,
    },
    data: updatePayload,
  });

  return result;
};

const deleteTimeSheetFromDB = async (id: string) => {
  const trip = await isTimeSheetExists(id);

  const currentDate = new Date();
  const timePassed = currentDate.getTime() - new Date(trip.createdAt).getTime();

  // If more than 24 hours have passed, deny the update
  if (timePassed > 24 * 60 * 60 * 1000) {
    // 24 hours in milliseconds
    throw new Error("You cannot delete the trip after 24 hours.");
  }

  const result = await prisma.time_Sheet.delete({
    where: {
      id,
    },
  });
  return result;
};

export const TimeSheetServices = {
  createTimeSheetIntoDB,
  getAllTimeSheetsFromDB,
  updateTimeSheetIntoDB,
  deleteTimeSheetFromDB,
};
