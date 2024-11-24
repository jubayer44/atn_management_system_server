import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = err?.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success: boolean = false;
  let message: string = err.message || "Something went wrong!";
  let error: any = err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handling Prisma Client known request errors
    if (err.code === "P2002") {
      statusCode = 403;
      message = "Duplicate Error";
      error = err.meta;
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = "Database Initialization Error";
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = "Critical Database Error";
  } else if (err.name === "ValidationError") {
    statusCode = err.statusCode || 400;
    message = "Validation Error";
    error = err.errors;
  } else if (err instanceof ZodError) {
    // Handling Zod validation errors
    statusCode = 400;
    message = "Zod Validation Error";
    error = err.errors.map((e) => ({
      path: e?.path[2],
      message: e?.message,
    }));
  }

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
