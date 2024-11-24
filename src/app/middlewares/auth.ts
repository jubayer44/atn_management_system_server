import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { jwtHelpers } from "../../shared/jwtHelpers";
import prisma from "../../shared/prisma";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ success: false, message: "No token provided" });
    }

    const verifiedUser = jwtHelpers.verifyToken(
      token,
      config.jwt.JWT_SECRET as Secret
    );

    if (verifiedUser?.error) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: verifiedUser.error || "You are not authorized!",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: verifiedUser.id,
        status: "ACTIVE",
      },
    });

    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ success: false, message: "User not found" });
    }

    if (user.passwordChangedAt) {
      const iat = verifiedUser.iat as number;
      const passwordChangedAt = Math.floor(
        new Date(user.passwordChangedAt).getTime() / 1000
      );

      if (passwordChangedAt > iat) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "Token is invalid, password has been changed!",
        });
      }
    }

    req.user = verifiedUser;

    if (roles.length && !roles.includes(verifiedUser.role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden access!",
      });
    }

    next();
  };
};

export default auth;
