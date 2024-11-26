import { Time_Sheet } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

export const isTimeSheetAlreadyExists = async (tripData: Time_Sheet) => {
  const tripIdExists = await prisma.time_Sheet.findFirst({
    where: {
      tripId: tripData.tripId,
    },
  });

  if (tripIdExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Trip ID already exists in the database."
    );
  }

  const exists = await prisma.time_Sheet.findFirst({
    where: {
      date: tripData.date, // Same date
      AND: [
        {
          // New trip start time should not overlap with any existing trip
          tripStartTime: {
            lt: tripData.tripEndTime, // New trip start should be before the existing trip's end
          },
        },
        {
          // New trip end time should not overlap with any existing trip
          tripEndTime: {
            gt: tripData.tripStartTime, // New trip end should be after the existing trip's start
          },
        },
      ],
    },
  });

  if (exists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A trip already exists for this date and time."
    );
  }

  return false;
};

export const isTimeSheetExists = async (id: string) => {
  const result = await prisma.time_Sheet.findUnique({
    where: {
      id,
    },
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "TimeSheet not found");
  }
  return result;
};

export const getTimeDuration = (tripData: Time_Sheet) => {
  // Ensure tripStartTime and tripEndTime are valid Date objects
  let date1 = new Date(tripData.tripStartTime);
  let date2 = new Date(tripData.tripEndTime);

  // Check if the dates are valid (NaN means invalid Date)
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    throw new Error("Invalid date format");
  }

  // Set seconds and milliseconds to 0 for both dates
  date1.setSeconds(0);
  date1.setMilliseconds(0);

  date2.setSeconds(0);
  date2.setMilliseconds(0);

  // Calculate the time difference in milliseconds
  const timeDifference = date2.getTime() - date1.getTime();

  // Convert milliseconds to total minutes (without considering seconds)
  const totalMinutes = Math.floor(timeDifference / (1000 * 60)); // Total minutes

  // Calculate hours and remaining minutes
  const hours = Math.floor(totalMinutes / 60); // Hours
  const minutes = totalMinutes % 60; // Remaining minutes

  // Format the result
  let result;
  if (hours >= 1) {
    // If hours >= 1, show hours and minutes
    result = `${hours}:${minutes.toString().padStart(2, "0")}`;
  } else {
    // If less than 1 hour, show only minutes in "0:xx" format
    result = `0:${minutes.toString().padStart(2, "0")}`; // Showing minutes even if it's less than an hour
  }

  return result;
};

export const DurationInNumberAndAmount = (tripData: Time_Sheet) => {
  const date1 = new Date(tripData.tripStartTime);
  const date2 = new Date(tripData.tripEndTime);

  // Set seconds and milliseconds to 0 for both dates
  date1.setSeconds(0);
  date1.setMilliseconds(0);

  date2.setSeconds(0);
  date2.setMilliseconds(0);

  // Calculate the time difference in milliseconds
  const timeDifference = date2.getTime() - date1.getTime();

  // Convert milliseconds to minutes
  const durationNumber = Number(timeDifference / (1000 * 60 * 60)).toFixed(5); // Total minutes

  const multiply = Number(durationNumber) * Number(tripData.hourlyRate);

  const tripAmount = multiply.toFixed(5);

  return { durationNumber, tripAmount };
};

export const convertDecimalHoursToTime = (decimalHours: any) => {
  const hours = Math.floor(decimalHours); // Get the integer part (hours)
  const minutes = Math.round((decimalHours - hours) * 60); // Convert the decimal part to minutes

  // Ensure both hours and minutes are two digits
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
};
