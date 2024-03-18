import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { decrypt, encrypt } from "../utils/encryption";
import WifiModel from "../models/wifi.model";
import { paginate } from "../utils/pagination";

export const addWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { wifiName, wifiPassword } = req.body;
    console.log(wifiName);
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

    const searchFields = ["name"];

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
      console.error("Failed to get wifi details:", error);
      next(error);
    }
  }
);

export const editWifi = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { wifiId } = req.params;
    const updates: Record<string, any> = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    // Retrieve the user to get their unique salt and encryption key
    const user = await userModel.findById(userId).select("+password +esalt");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const userSalt = user.esalt;
    const userPassword = user.password;
    const userEncryptionKey = decrypt(
      user.encryptedEncryptionKey,
      userPassword,
      userSalt
    );

    const encryptedUpdates: Record<string, any> = Object.keys(updates).reduce(
      (acc: any, key: any) => {
        if (["wifiName", "wifiPassword"].includes(key)) {
          acc[key] = encrypt(updates[key], userEncryptionKey, userSalt);
        } else {
          acc[key] = updates[key];
        }
        return acc;
      },
      {}
    );

    // Perform the update
    const updatedPassword = await WifiModel.findOneAndUpdate(
      { _id: wifiId, user: userId },
      { $set: encryptedUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedPassword) {
      return next(
        new ErrorHandler("Wifi not found or not owned by the user", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Wifi updated successfully",
      data: updatedPassword,
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
