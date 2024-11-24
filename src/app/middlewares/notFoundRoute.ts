import { Request, Response } from "express";
import httpStatus from "http-status";

const notFoundRoute = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "Route not found",
    error: {
      path: req.originalUrl,
      message: `Your request URL ${req.originalUrl} was not found on this server`,
    },
  });
};

export default notFoundRoute;
