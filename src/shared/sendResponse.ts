import { Response } from "express";

type TResponseData<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: T | null | undefined;
};

const sendResponse = async <T>(
  res: Response,
  responseData: TResponseData<T>
) => {
  res.status(responseData.statusCode).json({
    success: responseData.success,
    statusCode: responseData.statusCode,
    message: responseData.message,
    meta: responseData.meta || null || undefined,
    data: responseData.data || null || undefined,
  });
};

export default sendResponse;
