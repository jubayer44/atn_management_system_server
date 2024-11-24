import express from "express";
import { AuthControllers } from "./auth.controllers";
import validationRequest from "../../middlewares/validationRequest";
import { AuthValidationSchemas } from "./auth.validations";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/login",
  validationRequest(AuthValidationSchemas.LoginUser),
  AuthControllers.loginUser
);

router.get(
  "/my-sessions",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthControllers.getMyLoggedInSession
);

router.post("/logout", AuthControllers.logoutUser);

router.post("/refresh-token", AuthControllers.refreshToken);

router.post(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthControllers.changePassword
);

router.post("/forgot-password", AuthControllers.forgotPassword);

router.post("/reset-password", AuthControllers.resetPassword);

router.delete(
  "/delete-session",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthControllers.removeMySession
);

router.delete(
  "/delete-session/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthControllers.removeOtherSessionFromDb
);

export const AuthRoutes = router;
