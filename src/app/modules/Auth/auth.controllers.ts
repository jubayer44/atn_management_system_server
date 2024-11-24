import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.services";

const loginUser = catchAsync(async (req, res) => {
  const userAgent = req.headers["user-agent"] as string;
  const result = await AuthServices.loginUser(req.body, userAgent);

  if (result?.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      secure: false, // Set to true in production if using HTTPS
      httpOnly: false,
      // sameSite: "none",
      // domain: "localhost",
      // path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  if (result?.session?.id) {
    res.cookie("userSession", result.session.id, {
      secure: false, // Set to true in production if using HTTPS
      httpOnly: false,
      // sameSite: "none",
      // domain: "localhost",
      // path: "/",
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: {
      accessToken: result?.accessToken,
      sessionId: result?.session?.id || null,
    },
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const clearCookie = (cookieName: string) => {
    res.clearCookie(cookieName, {
      secure: false, // Set to true in production if using HTTPS
      httpOnly: false,
      // sameSite: "none", // Set lax if using same site
      // domain: "localhost",
      // path: "/",
    });
  };

  clearCookie("refreshToken");
  clearCookie("userSession");

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged out successfully",
    data: null,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Token generated successfully",
    data: result,
  });
});

const changePassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user as any;
    const { oldPassword, newPassword } = req.body;
    // const data = pickFunction(req.body, ["oldPassword", "newPassword"]);
    const result = await AuthServices.changePassword(user, {
      oldPassword,
      newPassword,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password changed successfully",
      data: result,
    });
  }
);

const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Password reset link sent to your email. Please check your inbox or spam folder.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization || "";

  const result = await AuthServices.resetPassword(token, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getMyLoggedInSession = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthServices.getMyLoggedInSession(req.user);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User session retrieved successfully",
      data: result,
    });
  }
);

const removeMySession = catchAsync(async (req, res) => {
  const { userSession } = req.cookies;
  const result = await AuthServices.removeMySessionFromDb(userSession);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User session deleted successfully",
    data: result,
  });
});

const removeOtherSessionFromDb = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const id = req.params?.id;
    const result = await AuthServices.removeOtherSessionFromDb(id, req.user);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User session deleted successfully",
      data: result,
    });
  }
);

export const AuthControllers = {
  loginUser,
  logoutUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMyLoggedInSession,
  removeMySession,
  removeOtherSessionFromDb,
};
