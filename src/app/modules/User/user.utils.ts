import { UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";

export const isUserAlreadyExists = async (email: string) => {
  const res = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (res) {
    throw new AppError(httpStatus.CONFLICT, `${email} already exists`);
  }

  return;
};
export const isUserExists = async (id: string) => {
  const res = await prisma.user.findUnique({
    where: {
      id,
      status: UserStatus.ACTIVE,
    },
  });

  if (!res) {
    throw new AppError(httpStatus.NOT_FOUND, `User not found`);
  }

  return res;
};
