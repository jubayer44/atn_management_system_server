import express from "express";
import { UserControllers } from "./user.controllers";
import validationRequest from "../../middlewares/validationRequest";
import { UserValidationSchemas } from "./user.validations";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/all-users", auth(UserRole.ADMIN), UserControllers.getAllUsers);

router.post(
  "/create-user",
  auth(UserRole.ADMIN),
  validationRequest(UserValidationSchemas.createValidation),
  UserControllers.createUser
);

router.get(
  "/get-user/:id",
  auth(UserRole.ADMIN),
  UserControllers.getSingleUser
);

router.get(
  "/my-profile",
  auth(UserRole.ADMIN, UserRole.USER),
  UserControllers.getMyProfile
);

router.put(
  "/update-user/:id",
  auth(UserRole.ADMIN),
  validationRequest(UserValidationSchemas.updateValidation),
  UserControllers.updateUserWithAdmin
);

router.put(
  "/update/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  validationRequest(UserValidationSchemas.updateUserName),
  UserControllers.updateUserName
);

router.delete(
  "/delete-user/:id",
  auth(UserRole.ADMIN),
  UserControllers.deleteUser
);

router.delete(
  "/delete-multiple",
  auth(UserRole.ADMIN),
  validationRequest(UserValidationSchemas.deleteMultipleUser),
  UserControllers.deleteMultipleUser
);

router.get(
  "/all-employee",
  auth(UserRole.ADMIN),
  UserControllers.getAllEmployee
);

export const UserRoutes = router;
