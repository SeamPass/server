import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import WifiModel from "../models/wifi.model";
import { paginate } from "../utils/pagination";

export const addWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { wifiName, wifiPassword } = req.body;
    const userId = req.user?._id;

    if (!wifiName || !wifiPassword) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    await WifiModel.create({
      user: userId,
      wifiName,
      wifiPassword,
    });

    res.status(201).json({
      success: true,
      message: "Wifi details added successfully.",
    });
  }
);

export const getWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerms = req.query.search as string;

    const searchFields = ["wifiName"];

    // Retrieve all notes for the user with pagination
    const { results: wifi, pageInfo } = await paginate(
      WifiModel,
      { user: userId },
      searchTerms,
      searchFields,
      { page, limit }
    );

    if (!wifi.length) {
      return next(new ErrorHandler("No notes found", 404));
    }

    const wifiDetails = wifi.map((wifiEntry: any) => ({
      id: wifiEntry._id,
      wifiPassword: wifiEntry.wifiPassword,
      wifiName: wifiEntry.wifiName,
      createdAt: wifiEntry.createdAt,
      updatedAt: wifiEntry.updatedAt,
    }));

    res.status(200).json({
      success: true,
      ...pageInfo,
      data: wifiDetails,
    });
  }
);

export const getSingleWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req?.user?._id;
      const note = await WifiModel.findOne({ _id: id, user: userId });

      if (!note) {
        return next(
          new ErrorHandler("Wifi details not found or access denied.", 404)
        );
      }

      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }
);

export const editWifiDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { wifiId } = req.params;

    const updates = req.body;
    const userId = req.user?._id;

    const updatedWifi = await WifiModel.findOneAndUpdate(
      { _id: wifiId, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedWifi) {
      return next(
        new ErrorHandler("Wifi not found or not owned by the user", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Wifi details updated successfully",
      data: updatedWifi,
    });
  }
);

export const deleteSingleWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { wifiId } = req.params;

    if (!wifiId) {
      return next(new ErrorHandler("Wifi ID is required.", 400));
    }

    const deletionResult = await WifiModel.deleteOne({
      _id: wifiId,
      user: userId,
    });

    if (deletionResult.deletedCount === 0) {
      return next(
        new ErrorHandler("Wifi not found or not owned by the user.", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Wifi has been successfully deleted.",
    });
  }
);

export const deleteMultipleWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { wifiIds } = req.body;

    if (!Array.isArray(wifiIds) || wifiIds.length === 0) {
      return next(new ErrorHandler("An array of wifi IDs is required.", 400));
    }

    const deletionResult = await WifiModel.deleteMany({
      _id: { $in: wifiIds },
      user: userId,
    });

    if (deletionResult.deletedCount === 0) {
      return next(
        new ErrorHandler(
          "No wifis were deleted. They may not exist or not be owned by the user.",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      message: `${deletionResult.deletedCount} wifis have been successfully deleted.`,
    });
  }
);
