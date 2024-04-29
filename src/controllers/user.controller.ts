require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import crypto from "crypto";
import logger from "../utils/logger";
import {
  generateRandomCode,
  generateSessionIdentifier,
} from "../utils/generateRandomCode";
import EmailVerificationModel from "../models/emailVerification.model";
import { sendToken } from "../utils/jwt";
import { minutesToFutureTimestamp } from "../utils/minutesToFutureTimestamp";
import EncryptionKeyModel from "../models/encryptionKeyModel";
import sharp from "sharp";
import s3 from "../utils/s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sendEmail from "../utils/sendMail";

interface IRegisterUser {
  nickname: string;
  email: string;
  password: string;
  verificationToken?: string;
  tokenExpiration?: Date;
}

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nickname, email, hashedPassword, clientSalt } = req.body;

      // Validation checks
      if (!nickname || !email || !hashedPassword || !clientSalt) {
        return next(
          new ErrorHandler("Please provide nickname, email, and password.", 400)
        );
      }

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists.", 400));
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");

      const currentTime = new Date();

      let tokenExpiration = new Date(currentTime.getTime() + 3600000);

      // Create new user with hashed password and encrypted encryption key
      const newUser = await userModel.create({
        nickname,
        email,
        password: hashedPassword,
        clientSalt,
        verificationToken,
        tokenExpiration,
      });

      const data = {
        token: verificationToken,
        name: newUser.nickname,
        email: newUser.email,
      };

      await sendEmail({
        email: newUser.email,
        data,
        template: "verify-email.ejs",
        subject: "Welcome",
      });

      //Send verification email
      res.status(201).json({
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
        data: {
          id: newUser._id,
          nickname: newUser.nickname,
          email: newUser.email,
        },
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

export const resendVerificationLink = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler("Please provide your email address", 400));
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("Email not found", 404));
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Your account is already verified.",
      });
    }
    // Generate a new verification token
    const newVerificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newVerificationToken;
    user.tokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    await user.save();

    const data = {
      token: newVerificationToken,
      name: user.nickname,
      email: user.email,
    };

    // Send the email with the verification link
    try {
      await sendEmail({
        email: user.email,
        data,
        template: "verify-email.ejs",
        subject: "Verify Your Email Address",
      });
      res.status(200).json({
        success: true,
        message: "Verification link has been resent to your email address.",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email.",
      });
    }
  }
);

// VERIFY USER
export const verifyUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400);
        return next(new ErrorHandler("Token is missing", 400));
      }

      const user = await userModel.findOne({
        verificationToken: token,
        tokenExpiration: { $gt: new Date() }, // Check if the token is not expired
      });

      if (!user) {
        return next(
          new ErrorHandler(
            "User does not exist or the token has expired. Please request a new verification link.",
            400
          )
        );
      }

      user.isVerified = true;

      // Clear the reset token and expiration
      user.verificationToken = undefined;

      // Clear the expiration time
      user.tokenExpiration = undefined;

      // Save the user with the new password
      await user.save();

      // Log the successful email verification
      logger.info(`Email verified for user ID: ${user._id}`);

      // Send email

      try {
        await sendEmail({
          email: user.email,
          data: { nickname: user.nickname },
          template: "email-verified.ejs",
          subject: "Verification Successful",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to send Email verified",
        });
      }

      // Response to the client
      res
        .status(200)
        .json({ success: true, message: "Your account has been verified" });
    } catch (error: any) {
      // Handle errors and pass them to the error handling middleware
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Login the user
export const login = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Find the user based on the email
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Compare the client-side hashed password with the stored hashed password
    const isCorrectPassword = await user.comparePassword(password);
    if (!isCorrectPassword) {
      return next(new ErrorHandler("Incorrect password ", 400));
    }

    if (!user.isVerified) {
      return next(
        new ErrorHandler(
          "Please verify your account before proceeding to login",
          400
        )
      );
    }

    // Check if two-step verification is enabled for the user
    const emailVerification = await EmailVerificationModel.findOne({
      userId: user._id,
    });

    if (emailVerification && emailVerification.isForLoginEnabled) {
      // Generate a new verification code
      const tempCode = generateRandomCode(6);
      emailVerification.emailVerificationCode = tempCode;
      emailVerification.expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration

      await emailVerification.save();

      // Send the code to the user's email
      const data = {
        code: tempCode,
      };
      try {
        await sendEmail({
          email: user.email,
          template: "login-code.ejs",
          data,
          subject: "OTP",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to send Email verified",
        });
      }

      // Inform the user that a verification code has been sent
      return res.status(200).json({
        success: true,
        message: "Please verify the code sent to your email.",
        tempCode,
        is2StepEnabled: emailVerification.isForLoginEnabled,
      });
    } else {
      // If two-step verification is not enabled, proceed with normal login
      const userInfo = await userModel
        .findOne({ email })
        .select(
          "-password -twoFactorSecret -resetPasswordExpire -salt -esalt -encryptedEncryptionKey -resetPasswordToken -verificationToken  -tokenExpiration"
        );

      // Generate a unique identifier for the session
      const info = await EncryptionKeyModel.findOne({
        userId: user._id,
      }).lean();

      const AllInfo = {
        userInfo,
        mk: info?.mk,
        iv: info?.iv,
        salt: info?.salt,
        is2StepEnabled: emailVerification?.isForLoginEnabled,
      };

      sendToken(AllInfo, 200, res);
    }
  }
);

//Resend User OTP
export const resendOtp = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    // Find the user based on the email
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }
    try {
      // Check if two-step verification is enabled for the user
      const emailVerification = await EmailVerificationModel.findOne({
        userId: user._id,
      });

      if (emailVerification && emailVerification.isForLoginEnabled) {
        // Generate a new verification code
        const tempCode = generateRandomCode(6);
        emailVerification.emailVerificationCode = tempCode;
        emailVerification.expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration

        await emailVerification.save();

        // Send the code to the user's email
        const data = {
          code: tempCode,
        };
        try {
          await sendEmail({
            email: user.email,
            template: "login-code.ejs",
            data,
            subject: "OTP",
          });

          // Inform the user that a verification code has been sent
          return res.status(200).json({
            success: true,
            message: "Please verify the code sent to your email.",
            tempCode,
            is2StepEnabled: emailVerification.isForLoginEnabled,
          });
        } catch (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to send Email verified",
          });
        }
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?._id;
    const { oldPassword, newPassword, confirmNewPassword, newSalt } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword || !newSalt) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    if (newPassword !== confirmNewPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    // Fetch the user document from the database
    const user = await userModel.findById(userId).select("+password +salt");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Compare the client-side hashed password with the stored hashed password
    const isCorrectPassword = await user.comparePassword(oldPassword);
    if (!isCorrectPassword) {
      return next(new ErrorHandler("Incorrect password ", 400));
    }

    // Update the user's password with the new hashed password and new client-side generated salt
    user.password = newPassword;
    user.clientSalt = newSalt;
    await user.save();

    const info = await EncryptionKeyModel.findOne({
      userId: user._id,
    }).lean();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      ...info,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getSalt = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;

    const user = await userModel.findOne({ email: email as string });

    if (!user) {
      return next(new ErrorHandler("User not found.", 400));
    }

    res.json({ success: true, salt: user.clientSalt });
  }
);

export const updateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id;

    const { nickname, email } = req.body;

    try {
      const updatedUser = await userModel
        .findByIdAndUpdate(
          userId,
          { nickname, email },
          { new: true, runValidators: true }
        )
        .select(
          "-password -salt -ps -sek -verificationToken -tokenExpiration -resetPasswordToken -resetPasswordExpire"
        );

      if (!updatedUser) {
        return next(new ErrorHandler("User not found", 404));
      }

      const userInfo = {
        ...updatedUser.toJSON(),
        password: undefined,
        salt: undefined,
        ps: undefined,
        sek: undefined,
        verificationToken: undefined,
        tokenExpiration: undefined,
      };

      return res.status(200).json({
        success: true,
        message: "User profile updated",
        user: userInfo,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const unlockUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Find the user based on the email
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Compare the client-side hashed password with the stored hashed password
    const isCorrectPassword = await user.comparePassword(password);
    if (!isCorrectPassword) {
      return next(new ErrorHandler("Incorrect password ", 400));
    }

    const info = await EncryptionKeyModel.findOne({
      userId: user._id,
    }).lean();

    // Inform the user that a verification code has been sent
    return res.status(200).json({
      success: true,
      ...info,
      message: "Account Unlocked",
    });
  }
);

const s3BucketName = process.env.S3_BUCKET_NAME!;
const imageName = generateSessionIdentifier();
export const uploadProfileImage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const buffer = await sharp(req.file?.buffer)
        .resize({ height: 500, width: 500, fit: "cover" })
        .toBuffer();
      const params = {
        Bucket: s3BucketName,
        Key: imageName,
        Body: buffer,
        ContentType: req.file?.mimetype,
      };
      const command = new PutObjectCommand(params);

      await s3.send(command);

      const updatedUser = await userModel.findOneAndUpdate(
        { _id: req.user._id },
        { avatar: imageName },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found.");
      }

      res.status(200).send({
        success: true,
        message: "Profile picture uploaded successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id;

    try {
      const user = await userModel.findById(userId);
      const emailVerification = await EmailVerificationModel.findOne({
        userId,
      });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      let avatarUrl = "";
      if (user?.avatar) {
        const getObjectParams = {
          Bucket: s3BucketName,
          Key: user.avatar,
        };
        const command = new GetObjectCommand(getObjectParams);
        avatarUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      const is2StepEnabled = emailVerification
        ? emailVerification.isForLoginEnabled
        : false;

      const userInfo = {
        ...user.toJSON(),
        password: undefined,
        salt: undefined,
        ps: undefined,
        sek: undefined,
        verificationToken: undefined,
        is2StepEnabled,
        avatar: avatarUrl,
      };

      return res.status(200).json({
        success: true,
        user: userInfo,
        is2StepEnabled,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
