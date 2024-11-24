import { UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { JwtPayload, Secret } from "jsonwebtoken";
import UAParser from "ua-parser-js";
import config from "../../../config";
import { jwtHelpers } from "../../../shared/jwtHelpers";
import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import { isUserExists } from "../User/user.utils";
import { htmlTemplate } from "./html";
import sendEmail from "./sendEmail";

type TLoginPayload = {
  email: string;
  password: string;
  city: string;
  country: string;
};

const loginUser = async (payload: TLoginPayload, userAgent: string) => {
  const parser = new (UAParser as any)();
  const results = parser?.setUA(userAgent)?.getResult();
  const browser = results?.browser?.name || "Unknown Browser";
  const device = results?.os?.name || "Unknown Device";
  const city = payload?.city || "Unknown City";
  const country = payload?.country || "Unknown Country";

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password incorrect!");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
    config.jwt.JWT_SECRET as Secret,
    config.jwt.JWT_EXPIRES_IN as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
    config.jwt.REFRESH_SECRET as Secret,
    config.jwt.REFRESH_EXPIRES_IN as string
  );

  const session = await prisma.session.create({
    data: {
      userId: userData.id,
      city: city,
      country: country,
      browser,
      device,
    },
    select: {
      id: true,
    },
  });

  return {
    accessToken,
    refreshToken,
    session,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "No token provided!");
  }

  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.REFRESH_SECRET as Secret
    );
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
    config.jwt.JWT_SECRET as Secret,
    config.jwt.JWT_EXPIRES_IN as string
  );

  return {
    accessToken,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await isUserExists(userData.id);

  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    user.password
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password is incorrect!");
  }

  const newPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.password_salt)
  );

  const result = await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: newPassword,
      passwordChangedAt: new Date(),
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

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findFirst({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const resetPassToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },

    config.jwt.RESET_PASS_TOKEN_SECRET as Secret,
    config.jwt.RESET_PASS_TOKEN_EXPIRES_IN as string
  );

  const resetPasswordLink = `${config.reset_password_link}/reset-password?id=${user.id}&token=${resetPassToken}`;

  const html = htmlTemplate(resetPasswordLink);

  await sendEmail(user.email, html);
  return;
};

const resetPassword = async (
  token: string,
  payload: { id: string; password: string }
) => {
  const user = await prisma.user.findFirst({
    where: {
      id: payload?.id,
      status: UserStatus.ACTIVE,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const isTokenValid = jwtHelpers.verifyToken(
    token,
    config.jwt.RESET_PASS_TOKEN_SECRET as Secret
  );

  if (!isTokenValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token!");
  }

  if (isTokenValid.id !== payload?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token!");
  }

  if (user.passwordChangedAt) {
    const iat = isTokenValid.iat as number;
    const passwordChangedAt = Math.floor(
      new Date(user.passwordChangedAt).getTime() / 1000
    );

    if (passwordChangedAt > iat) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Token is invalid, password has been changed!"
      );
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload?.password,
    Number(config.password_salt)
  );

  await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

  return;
};

const getMyLoggedInSession = async (user: JwtPayload) => {
  const result = await prisma.session.findMany({
    where: {
      userId: user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

const removeMySessionFromDb = async (id: string) => {
  const isExistsSession = await prisma.session.findUnique({
    where: {
      id,
    },
  });

  if (!isExistsSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Session not found");
  }

  const result = await prisma.session.delete({
    where: {
      id,
    },
  });

  return result;
};

const removeOtherSessionFromDb = async (id: string, user: JwtPayload) => {
  await isUserExists(user.id);

  const isExistsSession = await prisma.session.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!isExistsSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Session not found");
  }

  const result = await prisma.session.delete({
    where: {
      id,
      userId: user.id,
    },
  });

  return result;
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMyLoggedInSession,
  removeMySessionFromDb,
  removeOtherSessionFromDb,
};
