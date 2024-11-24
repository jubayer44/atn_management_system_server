import express from "express";
import { TimeSheetControllers } from "./timeSheet.controllers";
import validationRequest from "../../middlewares/validationRequest";
import { TimeSheetValidationSchemas } from "./timeSheet.validations";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/create-time-sheet",
  auth(UserRole.ADMIN, UserRole.USER),
  validationRequest(TimeSheetValidationSchemas.createValidation),
  TimeSheetControllers.createTimeSheet
);

router.get(
  "/time-sheet",
  auth(UserRole.ADMIN, UserRole.USER),
  TimeSheetControllers.getAllTimeSheet
);
router.put(
  "/time-sheet/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  validationRequest(TimeSheetValidationSchemas.updateValidation),
  TimeSheetControllers.updateTimeSheet
);

router.delete(
  "/time-sheet/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  TimeSheetControllers.deleteTimeSheet
);

export const TimeSheetRoutes = router;
