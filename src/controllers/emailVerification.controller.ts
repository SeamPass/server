import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import EmailVerificationModel from "../models/emailVerification.model";
import { generateRandomCode } from "../utils/generateRandomCode";
import { sendToken } from "../utils/jwt";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import EncryptionKeyModel from "../models/encryptionKeyModel";
import sendMail from "../utils/sendMail";

export const enableEmailVerificationForLogin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const emailVerificationCode = generateRandomCode(6);
    const expirationTime = new Date(Date.now() + 3600000);

    await EmailVerificationModel.findOneAndUpdate(
      { userId },
      {
        emailVerificationCode: emailVerificationCode,
        expirationTime: expirationTime,
      },
      { upsert: true, new: true }
    );

    const user = await userModel.findById({ _id: userId });

    // Send the verification code to the user's email
    const data = {
      code: emailVerificationCode,
      name: user?.nickname,
    };

    try {
      await sendMail({
        email: user?.email,
        data,
        template: "enable2Step-code.ejs",
        subject: "Code",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to send Welcome email",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent. Please check your email.",
      emailVerificationCode,
    });
  }
);

export const verifyEmailVerificationOnEnable = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { verificationCode } = req.body;
    const userId = req.user?._id;

    const emailVerification = await EmailVerificationModel.findOne({ userId });

    if (!emailVerification) {
      return res.status(404).json({
        success: false,
        message: "Verification record not found.",
      });
    }

    if (
      verificationCode === emailVerification.emailVerificationCode &&
      emailVerification.expirationTime > new Date()
    ) {
      emailVerification.emailVerificationCode = undefined;
      emailVerification.isForLoginEnabled = true; // Set to true after successful verification
      await emailVerification.save();

      res.status(200).json({
        success: true,
        message: "Email verification enabled successfully.",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }
  }
);

export const disableEmailVerificationForLogin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    await EmailVerificationModel.findOneAndUpdate(
      { userId },
      { isForLoginEnabled: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Email verification for login has been disabled.",
    });
  }
);

export const verifyEmailVerificationCode = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, verificationCode } = req.body;

    // Find the user based on the email
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const emailVerification = await EmailVerificationModel.findOne({
      userId: user._id,
    });

    if (!emailVerification || !emailVerification.isForLoginEnabled) {
      return res.status(404).json({
        success: false,
        message: "Two-step verification is not enabled or code not found.",
      });
    }

    // Check if the provided code matches and is not expired
    if (
      verificationCode === emailVerification.emailVerificationCode &&
      emailVerification.expirationTime > new Date()
    ) {
      // Reset the verification code as it's been used
      emailVerification.emailVerificationCode = undefined;
      await emailVerification.save();

      // Proceed to authenticate the user (e.g., issuing a JWT token)
      const userInfo = await userModel
        .findById(user._id)
        .select(
          "-password -twoFactorSecret -resetPasswordExpire -resetPasswordToken -verificationToken -tokenExpiration"
        );

      const info = await EncryptionKeyModel.findOne({
        userId: user._id,
      }).lean();

      const AllInfo = {
        userInfo,
        mk: info?.mk,
        iv: info?.iv,
        salt: info?.salt,
      };

      sendToken(AllInfo, 200, res);
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }
  }
);
