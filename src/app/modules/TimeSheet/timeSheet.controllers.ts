import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { TimeSheetServices } from "./timeSheet.services";
import { timeSheetPayloadKeys } from "./timeSheet.constant";
import pickFunction from "../../../shared/picFunction";
import { parsePaginationOptions } from "../../../shared/parsePaginationOptions";
import { paginationOptions } from "../../constant";

const createTimeSheet = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await TimeSheetServices.createTimeSheetIntoDB(
      req.body,
      req.user
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Time Sheet created successfully",
      data: result,
    });
  }
);

const getAllTimeSheet = catchAsync(async (req, res) => {
  const filtersField = pickFunction(req.query, timeSheetPayloadKeys);
  const options = parsePaginationOptions(
    pickFunction(req?.query, paginationOptions)
  );
  const result = await TimeSheetServices.getAllTimeSheetsFromDB(
    filtersField,
    options
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All Time Sheet retrieved successfully",
    data: result,
  });
});

const updateTimeSheet = catchAsync(async (req, res) => {
  const result = await TimeSheetServices.updateTimeSheetIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Time Sheet Updated Successfully",
    data: result,
  });
});

const deleteTimeSheet = catchAsync(async (req, res) => {
  const result = await TimeSheetServices.deleteTimeSheetFromDB(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Time Sheet deleted Successfully",
    data: result,
  });
});

export const TimeSheetControllers = {
  createTimeSheet,
  getAllTimeSheet,
  updateTimeSheet,
  deleteTimeSheet,
};
