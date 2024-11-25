import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import auth from "../../middlewares/auth";
import { TimeSheetControllers } from "./timeSheet.controllers";
import { TimeSheetValidationSchemas } from "./timeSheet.validations";

const router = express.Router();

router.post(
  "/create-time-sheet",
  auth(UserRole.USER),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if 'data' exists in the form-data
      if (!req.body.data) {
        return res.status(400).json({
          success: false,
          message: "'data' field is missing in the form-data",
        });
      }

      // Parse the 'data' field as JSON
      const parsedData = JSON.parse(req.body.data);

      // Validate the parsed data
      req.body = TimeSheetValidationSchemas.createValidation.parse({
        body: parsedData,
      });

      // Proceed with the controller
      return TimeSheetControllers.createTimeSheet(req, res, next);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Zod Validation Error",
        error: error.errors?.map((e: any) => e.message) || error,
      });
    }
  }
);

router.get(
  "/time-sheet",
  auth(UserRole.ADMIN, UserRole.USER),
  TimeSheetControllers.getAllTimeSheet
);

router.put(
  "/time-sheet/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if 'data' exists in the form-data
      if (!req.body.data) {
        return res.status(400).json({
          success: false,
          message: "'data' field is missing in the form-data",
        });
      }

      // Parse the 'data' field as JSON
      const parsedData = JSON.parse(req.body.data);

      // Validate the parsed data
      req.body = TimeSheetValidationSchemas.updateValidation.parse({
        body: parsedData,
      });

      // Proceed with the controller
      return TimeSheetControllers.updateTimeSheet(req, res, next);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Zod Validation Error",
        error: error.errors?.map((e: any) => e.message) || error,
      });
    }
  }
);

router.delete(
  "/time-sheet/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  TimeSheetControllers.deleteTimeSheet
);

router.get("/meta-data", TimeSheetControllers.getMetaData);

export const TimeSheetRoutes = router;
