import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import EncryptionKeyModel from "../models/encryptionKeyModel";
import mongoose from "mongoose";

export const storeEncryptedSGEK = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, iv, mk, salt } = req.body;
    try {
      if (!userId || !iv || !mk || !salt) {
        return next(new ErrorHandler("Please send all required fields", 400));
      }

      await EncryptionKeyModel.create({
        userId,
        mk,
        iv,
        salt,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      next(new ErrorHandler("Internal server error", 500));
    }
  }
);

export const retrieveEncryptedSGEK = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id;

    try {
      const encryptionDetails = await EncryptionKeyModel.findOne({ userId });

      if (!encryptionDetails) {
        return next(new ErrorHandler("Encryption details not found", 404));
      }

      res.status(200).json({
        success: true,
        data: {
          mk: encryptionDetails.mk,
          iv: encryptionDetails.iv,
          salt: encryptionDetails.salt,
        },
      });
    } catch (error) {
      next(new ErrorHandler("Internal server error", 500));
    }
  }
);

export const updateEncryptedSGEK = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id;
    const { mk, iv, newSalt } = req.body;

    if (!mk || !iv || !newSalt) {
      return next(
        new ErrorHandler("Missing required fields: mk, iv, or newSalt", 400)
      );
    }
    console.log(userId);
    try {
      const encryptionDetails = await EncryptionKeyModel.findOne({
        userId: userId,
      });
      console.log(encryptionDetails);
      if (!encryptionDetails) {
        return next(new ErrorHandler("Encryption details not found", 404));
      }

      // Update the properties
      encryptionDetails.mk = mk;
      encryptionDetails.iv = iv;
      encryptionDetails.salt = newSalt;

      // Save the document
      const updatedEncryptionDetails = await encryptionDetails.save();

      res.status(200).json({
        success: true,
        message: "Encryption details updated successfully",
        data: updatedEncryptionDetails,
      });
    } catch (error) {
      console.error("Error updating encryption details:", error);
      next(new ErrorHandler("Internal server error", 500));
    }
  }
);
