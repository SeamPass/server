import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import TwoFactorModel from "../models/twoFactorAuth.model";
import { generate2FASecret, verify2FAToken } from "../utils/twoFactorAuth";
import userModel from "../models/user.model";
import { generateRandomCode } from "../utils/generateRandomCode";

export const enable2fa = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id; // Assuming you have the user's ID from the session or JWT
      const userEmail = req.user?.email;

      // Check if the user already has 2FA setup
      let twoFactorSetup = await TwoFactorModel.findOne({ userId });

      if (!twoFactorSetup) {
        // If no 2FA setup, create a new one
        const newSecret = generate2FASecret(userEmail as string);
        console.log(newSecret);

        // Generate backup codes (example: 10 codes)
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
          backupCodes.push(generateRandomCode(6));
        }

        twoFactorSetup = new TwoFactorModel({
          userId: userId,
          secret: newSecret.secret,
          isEnabled: true,
          backupCodes: backupCodes,
          recoveryEmail: req.body.recoveryEmail, // Include the provided recovery email
          createdAt: new Date(), // Set the creation date
          lastUsed: null, // Initialize last used as null
          // Add any additional fields if needed
        });

        await twoFactorSetup.save();

        res.json({
          secret: newSecret.secret,
          qrCode: newSecret.qr,
          backupCodes: backupCodes,
        });
      } else if (!twoFactorSetup.isEnabled) {
        // If 2FA setup exists but not enabled, enable it

        const newSecret = generate2FASecret(userEmail as string);
        console.log(newSecret);

        // Generate backup codes (example: 10 codes)
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
          backupCodes.push(generateRandomCode(6));
        }

        twoFactorSetup.secret = newSecret.secret;
        twoFactorSetup.isEnabled = true;
        twoFactorSetup.backupCodes = backupCodes;
        twoFactorSetup.recoveryEmail = req.body.recoveryEmail; // Update the recovery email
        twoFactorSetup.createdAt = new Date(); // Update the creation date
        await twoFactorSetup.save();

        res.json({
          secret: newSecret.secret,
          qrCode: newSecret.qr,
          backupCodes,
        });
      } else {
        res.status(400).json({ message: "2FA is already enabled." });
      }
    } catch (error) {
      // handle errors
      next(error);
    }
  }
);

export const verify2FA = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { email, token } = req.body;

    // Fetch user from userModel to get the user ID
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch 2FA details from TwoFactorModel using the user's ID
    const twoFactorDetails = await TwoFactorModel.findOne({ userId: user._id });
    if (!twoFactorDetails) {
      return res
        .status(404)
        .json({ message: "2FA details not found for this user" });
    }

    if (!twoFactorDetails.isEnabled) {
      return res
        .status(400)
        .json({ message: "2FA is not enabled for this user." });
    }

    const verified = verify2FAToken(twoFactorDetails.secret, token);
    if (verified) {
      // 2FA token is correct, proceed to log the user in or perform the intended action
      res.json({ message: "2FA token verified successfully." });
    } else {
      res.status(401).json({ message: "Invalid 2FA token" });
    }
  }
);
