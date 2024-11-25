import { Prisma, Time_Sheet, UserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { JwtPayload } from "jsonwebtoken";
import { fileUploader } from "../../../helpers/fileUploader";
import { paginationHelpers } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prisma";
import { TFile } from "../../interfaces/file";
import { isUserExists } from "../User/user.utils";
import {
  convertDecimalHoursToTime,
  DurationInNumberAndAmount,
  getTimeDuration,
  isTimeSheetAlreadyExists,
  isTimeSheetExists,
} from "./timeSheet.utils";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TPagination, TTimeSheetQueryKeys } from "../../interfaces/common";

const createTimeSheetIntoDB = async (
  file: TFile,
  payload: Time_Sheet,
  userData: JwtPayload
) => {
  const user = await isUserExists(userData.id);

  if (file) {
    const uploadPhoto = await fileUploader.uploadToCloudinary(file);
    payload.tripReceipt = uploadPhoto?.secure_url || null;
  }

  const durationAndPayment = DurationInNumberAndAmount(payload);

  const tripData = {
    ...payload,
    name: user.name,
    date: new Date(payload.date),
    tripStartTime: new Date(payload.tripStartTime),
    tripEndTime: new Date(payload.tripEndTime),
    duration: getTimeDuration(payload),
    durationInNumber: new Decimal(durationAndPayment.durationNumber),
    payment: new Decimal(durationAndPayment.tripAmount),
    hourlyRate: new Decimal(payload.hourlyRate.toFixed(2)),
    userId: user.id,
  };

  await isTimeSheetAlreadyExists(tripData);

  if (payload.hourlyRate !== user.hourlyRate) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        hourlyRate: tripData.hourlyRate,
      },
    });
  }

  const result = await prisma.time_Sheet.create({
    data: tripData,
  });
  return result;
};

const getAllTimeSheetsFromDB = async (
  filtersField: TTimeSheetQueryKeys,
  options: TPagination,
  user: JwtPayload
) => {
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

  if (user.role === UserRole.USER) {
    andConditions.push({
      userId: user.id,
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

const updateTimeSheetIntoDB = async (
  id: string,
  file: TFile,
  payload: Time_Sheet,
  user: JwtPayload
) => {
  if (file) {
    const uploadPhoto = await fileUploader.uploadToCloudinary(file);
    payload.tripReceipt = uploadPhoto?.secure_url || null;
  }

  // Check if the trip exists
  const trip = await isTimeSheetExists(id);

  if (user.role === UserRole.USER && trip.userId !== user.id) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to delete this trip."
    );
  }

  const currentDate = new Date();
  const timePassed = currentDate.getTime() - new Date(trip.createdAt).getTime();

  const oneDay = 24 * 60 * 60 * 1000;

  // If more than 24 hours have passed, deny the update
  if (timePassed > oneDay && user.role !== UserRole.ADMIN) {
    // 24 hours in milliseconds
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot update the trip after 24 hours."
    );
  }

  const durationAndPayment = DurationInNumberAndAmount(payload);

  const updatePayload = {
    tripId: payload.tripId || trip.tripId,
    date: new Date(payload.date) || trip.date,
    tripStartTime: new Date(payload.tripStartTime) || trip.tripStartTime,
    tripEndTime: new Date(payload.tripEndTime) || trip.tripEndTime,
    tripReceipt: payload.tripReceipt || trip.tripReceipt,
    duration: getTimeDuration(payload),
    durationInNumber: new Decimal(durationAndPayment.durationNumber),
    payment: new Decimal(durationAndPayment.tripAmount),
    hourlyRate: new Decimal(payload.hourlyRate.toFixed(2)) || trip.hourlyRate,
    memo: payload.memo || trip.memo,
  };

  const { tripId, date, tripStartTime, tripEndTime } = payload;

  if (payload.hourlyRate !== trip.hourlyRate) {
    await prisma.user.update({
      where: {
        id: trip.id,
      },
      data: {
        hourlyRate: new Decimal(payload.hourlyRate.toFixed(2)),
      },
    });
  }

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
      throw new AppError(
        httpStatus.CONFLICT,
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
        throw new AppError(
          httpStatus.CONFLICT,
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

const deleteTimeSheetFromDB = async (id: string, user: JwtPayload) => {
  const trip = await isTimeSheetExists(id);

  if (user.role === UserRole.USER && trip.userId !== user.id) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to delete this trip."
    );
  }

  const currentDate = new Date();
  const timePassed = currentDate.getTime() - new Date(trip.createdAt).getTime();

  const oneDay = 24 * 60 * 60 * 1000;

  // If more than 24 hours have passed, deny the update
  if (timePassed > oneDay && user.role !== UserRole.ADMIN) {
    // 24 hours in milliseconds
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot delete the trip after 24 hours."
    );
  }

  const result = await prisma.time_Sheet.delete({
    where: {
      id,
    },
  });

  if (trip.tripReceipt && result?.id) {
    const imageUrl = trip.tripReceipt;
    const publicId = imageUrl?.split("/")?.pop()?.split(".")[0];

    await fileUploader.removeFromCloudinary(publicId as string);
  }

  return result;
};

const getMetaDataFromDB = async (
  date: string | undefined,
  user: JwtPayload
) => {
  let whereConditions: Prisma.Time_SheetWhereInput = {};

  if (user.role === UserRole.USER) {
    whereConditions.userId = user.id;
  }

  if (date) {
    // Split the date string (MM/DD/YYYY) into month, day, and year
    const [day, month, year] = date.split("/").map(Number);

    // Create start and end date for the month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1)); // Month is 0-indexed
    const endOfMonth = new Date(Date.UTC(year, month, 0)); // End of the month (0th day of the next month)

    // Explicitly set the start and end times to 00:00:00 and 23:59:59 in UTC
    startOfMonth.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
    endOfMonth.setUTCHours(23, 59, 59, 999); // Set to end of the month, 23:59:59 UTC

    whereConditions.date = {
      gte: startOfMonth, // Greater than or equal to start of the month
      lte: endOfMonth, // Less than or equal to end of the month
    };
  }

  // Aggregate to get the sum of payment and durationInNumber, and count the total records
  const [totalTrip, totalPayment, totalWorkingHours] = await Promise.all([
    prisma.time_Sheet.count({
      where: whereConditions,
    }),
    prisma.time_Sheet.aggregate({
      _sum: {
        payment: true,
      },
      where: whereConditions,
    }),
    prisma.time_Sheet.aggregate({
      _sum: {
        durationInNumber: true,
      },
      where: whereConditions,
    }),
  ]);

  const totalDurationFormatted = convertDecimalHoursToTime(
    totalWorkingHours._sum.durationInNumber
  );
  const totalPaymentFormatted = (totalPayment._sum.payment || 0).toFixed(4);

  return {
    totalTrip,
    totalDurationFormatted,
    totalPayment: totalPaymentFormatted,
  };
};

export const TimeSheetServices = {
  createTimeSheetIntoDB,
  getAllTimeSheetsFromDB,
  updateTimeSheetIntoDB,
  deleteTimeSheetFromDB,
  getMetaDataFromDB,
};
