import { Prisma, User, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { paginationHelpers } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prisma";
import { TPagination } from "../../interfaces/common";
import { isUserAlreadyExists, isUserExists } from "./user.utils";
import config from "../../../config";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createUserIntoDb = async (payload: User) => {
  await isUserAlreadyExists(payload.email);

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.password_salt)
  );

  const result = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hourlyRate: true,
      status: true,
    },
  });

  return result;
};

const getSingleUser = async (id: string) => {
  await isUserExists(id);

  const result = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return result;
};

const getMyProfileFromDb = async (user: any, sessionId: string) => {
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }
  await isUserExists(user.id);
  let session = null;
  if (sessionId) {
    session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
      },
    });
  }

  const userData = await prisma.user.findUnique({
    where: {
      id: user.id,
      email: user.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return {
    ...userData,
    session: session?.id ? true : false,
  };
};

const getAllUsersFromDb = async (
  params: {
    searchTerm?: string;
  },
  options: TPagination,
  user: JwtPayload
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "email"].map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (user.role !== UserRole.ADMIN) {
    andConditions.push({
      OR: [
        { role: UserRole.USER },
        { id: user.id }, // Include the current user
      ],
    });
  }
  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options?.sortBy && options?.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total: total,
    },
    data: result,
  };
};

const deleteUserFromDb = async (id: string) => {
  const isExistsUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!isExistsUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.delete({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
  return result;
};

const deleteMultipleUserFromDb = async (ids: string[]) => {
  const superAdmins = await prisma.user.findMany({
    where: {
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
    },
  });

  // Extract the super_admin IDs into an array
  const superAdminIds = superAdmins.map((user) => user.id);

  // Check if any super_admin ID is in the ids array
  const foundSuperAdminId = superAdminIds.find((id) => ids.includes(id));
  if (foundSuperAdminId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can't delete super admin users"
    );
  }

  // Check if all specified users exist
  const isMultipleUsersExists = await prisma.user.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  if (isMultipleUsersExists.length !== ids.length) {
    throw new AppError(httpStatus.NOT_FOUND, "Selected users not found");
  }

  // Proceed to delete the users
  const result = await prisma.user.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  return result;
};

const updateUserWithAdminIntoDb = async (
  id: string,
  payload: Partial<User>,
  user: JwtPayload
) => {
  if (user.id === id) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You can't update your own profile"
    );
  }

  const userData = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
  return result;
};

const updateUserNameIntoDb = async (
  id: string,
  payload: { name: string },
  user: JwtPayload
) => {
  await isUserExists(id);

  // if (user.id !== id) {
  //   throw new AppError(
  //     httpStatus.UNAUTHORIZED,
  //     "You are not authorized to perform this action"
  //   );
  // }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
  return result;
};

export const UserServices = {
  createUserIntoDb,
  getSingleUser,
  getMyProfileFromDb,
  getAllUsersFromDb,
  deleteUserFromDb,
  deleteMultipleUserFromDb,
  updateUserWithAdminIntoDb,
  updateUserNameIntoDb,
};
