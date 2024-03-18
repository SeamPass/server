import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import EncryptionKeyModel from "../models/encryptionKeyModel";

export const storeEncryptedSGEK = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, iv, sgek } = req.body;
    console.log({ userId, iv, sgek });
    try {
      if (!userId || !iv || !sgek) {
        return next(new ErrorHandler("Please send all required fields", 400));
      }

      await EncryptionKeyModel.create({
        userId,
        encryptedSGEK: sgek,
        iv,
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
          sgek: encryptionDetails.encryptedSGEK,
          iv: encryptionDetails.iv,
        },
      });
    } catch (error) {
      next(new ErrorHandler("Internal server error", 500));
    }
  }
);
