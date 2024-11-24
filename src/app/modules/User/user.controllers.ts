import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import { UserServices } from "./user.services";
import catchAsync from "../../../shared/catchAsync";
import pickFunction from "../../../shared/picFunction";
import { parsePaginationOptions } from "../../../shared/parsePaginationOptions";
import { paginationOptions } from "../../constant";
import { createUserPayloadKeys, updateUserPayloadKeys } from "./user.constant";
import { User } from "@prisma/client";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

const createUser = catchAsync(async (req, res) => {
  const data = pickFunction(req.body, createUserPayloadKeys);
  const result = await UserServices.createUserIntoDb(data as User);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created successfully",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await UserServices.getSingleUser(req.params?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Retrieved successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user as any;
    const sessionId = req.query.sessionId as string;

    const result = await UserServices.getMyProfileFromDb(user, sessionId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Profile Retrieved successfully",
      data: result,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const filtersField = pickFunction(req?.query, ["searchTerm"]);
    const options = parsePaginationOptions(
      pickFunction(req?.query, paginationOptions)
    );

    const result = await UserServices.getAllUsersFromDb(
      filtersField,
      options,
      req.user
    );

    const message = result?.meta?.total
      ? "All users retrieved successfully"
      : "No individual found";

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message,
      meta: result?.meta,
      data: result?.data,
    });
  }
);

const deleteUser = catchAsync(async (req, res) => {
  const result = await UserServices.deleteUserFromDb(req.params?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Deleted successfully",
    data: result,
  });
});

const deleteMultipleUser = catchAsync(async (req, res) => {
  const result = await UserServices.deleteMultipleUserFromDb(req.body?.ids);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Deleted successfully",
    data: result,
  });
});

const updateUserWithAdmin = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const data = pickFunction(req.body, updateUserPayloadKeys);
    const result = await UserServices.updateUserWithAdminIntoDb(
      req.params?.id,
      data,
      req.user
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Updated successfully",
      data: result,
    });
  }
);

const updateUserName = catchAsync(
  async (req: Request & { user?: JwtPayload }, res: Response) => {
    const data = pickFunction(req.body, ["name"]);
    const result = await UserServices.updateUserNameIntoDb(
      req.params?.id,
      data as { name: string },
      req.user as JwtPayload
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Updated successfully",
      data: result,
    });
  }
);

export const UserControllers = {
  createUser,
  getSingleUser,
  getMyProfile,
  getAllUsers,
  deleteUser,
  deleteMultipleUser,
  updateUserWithAdmin,
  updateUserName,
};
