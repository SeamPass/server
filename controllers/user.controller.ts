require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import crypto from "crypto";
import sendMail from "../utils/sendMail";
import logger from "../utils/logger";
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateRandomCode } from "../utils/generateRandomCode";
import EmailVerificationModel from "../models/emailVerification.model";
import {
  generateAccessToken,
  generateRefreshToken,
  sendToken,
} from "../utils/jwt";
import { decrypt, deriveKey, encrypt } from "../utils/encryption";
import { generateSalt, hashPassword } from "../utils/passwordHash";
import { minutesToFutureTimestamp } from "../utils/minutesToFutureTimestamp";
import EncryptionKeyModel from "../models/encryptionKeyModel";
import PasswordModel from "../models/password.model";

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
      console.log({ nickname, email, hashedPassword, clientSalt });
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

      // Generate a unique encryption key for each user
      const encryptionSalt = crypto.randomBytes(32).toString("hex");
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create new user with hashed password and encrypted encryption key
      const newUser = await userModel.create({
        nickname,
        email,
        password: hashedPassword,
        clientSalt,
        verificationToken,
        ps: encryptionSalt,
      });

      const data = {
        token: verificationToken,
        name: newUser.nickname,
      };

      try {
        await sendMail({
          email: newUser.email,
          data,
          template: "verify-email.ejs",
          subject: "Welcome",
        });
      } catch (err) {
        console.error("Failed to send email:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to send Welcome email",
        });
      }

      // Optional: Send verification email or perform other post-registration tasks
      res.status(201).json({
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
        data: {
          id: newUser._id,
          nickname: newUser.nickname,
          email: newUser.email,
          encryptionSalt,
        },
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

// export const registerUser = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { nickname, email, password } = req.body;

//       // Validation checks
//       if (!nickname || !email || !password) {
//         return next(
//           new ErrorHandler("Please provide nickname, email, and password.", 400)
//         );
//       }

//       const isEmailExist = await userModel.findOne({ email });
//       if (isEmailExist) {
//         return next(new ErrorHandler("Email already exists.", 400));
//       }

//       const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
//       if (!passwordRegex.test(password)) {
//         return next(
//           new ErrorHandler(
//             "Password must include numbers, lowercase and uppercase letters, and be at least 8 characters long.",
//             400
//           )
//         );
//       }

//       // Generate salt and hash the password
//       const salt = generateSalt();
//       const hashedPassword = await hashPassword(password, salt);

//       // Generate a unique encryption key for each user
//       const encryptionKey = crypto.randomBytes(32).toString("hex");
//       const esalt = generateSalt(); // Generate a separate salt for encryption
//       const encryptedEncryptionKey = encrypt(
//         encryptionKey,
//         hashedPassword,
//         esalt
//       );

//       const verificationToken = crypto.randomBytes(32).toString("hex");

//       // Create new user with hashed password and encrypted encryption key
//       const newUser = await userModel.create({
//         nickname,
//         email,
//         password: hashedPassword,
//         salt,
//         encryptedEncryptionKey,
//         esalt,
//         verificationToken,
//       });

//       const data = {
//         token: verificationToken,
//         name: newUser.nickname,
//       };

//       try {
//         await sendMail({
//           email: newUser.email,
//           data,
//           template: "verify-email.ejs",
//           subject: "Welcome",
//         });
//       } catch (err) {
//         console.error("Failed to send email:", err);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to send Welcome email",
//         });
//       }

//       // Optional: Send verification email or perform other post-registration tasks

//       res.status(201).json({
//         success: true,
//         message:
//           "Account created successfully. Please check your email to verify your account.",
//         data: {
//           id: newUser._id,
//           nickname: newUser.nickname,
//           email: newUser.email,
//         },
//       });
//     } catch (error: any) {
//       next(new ErrorHandler(error.message, 500));
//     }
//   }
// );

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
      return res.status(200).json({
        success: true,
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
    };

    // Send the email with the reset link
    try {
    } catch (err) {
      console.error("Failed to send email:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }
    console.log(user.email);
    // Resend the email
    try {
      /////

      res.status(200).json({
        success: true,
        message: "Verification link has been resent to your email address.",
      });
    } catch (error) {
      next(new ErrorHandler("Failed to send verification email", 500));
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
        res.status(400);
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

      // Send email (uncomment this section if needed)
      /*
        sendMail({
          email: user.email,
          template: "verification-successful.ejs",
          subject: "Verification Successful",
        });
        */

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
    if (user.password !== password) {
      return next(new ErrorHandler("Invalid password", 401));
    }

    // Check if two-step verification is enabled for the user
    const emailVerification = await EmailVerificationModel.findOne({
      userId: user._id,
    });

    if (emailVerification && emailVerification.isForLoginEnabled) {
      console.log("Email verification for login is enabled");

      // Generate a new verification code
      const tempCode = generateRandomCode(6);
      emailVerification.emailVerificationCode = tempCode;
      emailVerification.expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration

      await emailVerification.save();

      // Send the code to the user's email
      // TODO: Implement sendVerificationEmail function to send the code
      // await sendVerificationEmail(user.email, tempCode);

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
      console.log(info);
      const AllInfo = {
        userInfo,
        mk: info?.mk,
        iv: info?.iv,
        salt: info?.salt,
      };

      sendToken(AllInfo, 200, res);
    }
  }
);

//Logout User
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1,
      });
      res.cookie("refresh_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1,
      });
      res.json({ success: true, message: "Logged out successfully" });

      // Optional: Log the user logout action
      // Assuming logger is defined and you can obtain the user ID from the request (if the user was authenticated)
      // logger.info(`User ID: ${req.user?._id} logged out`);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;

      if (!refresh_token) {
        return next(new ErrorHandler("Refresh token is required", 400));
      }

      // Verify the refresh token
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN!
      ) as JwtPayload;
      if (!decoded.id) {
        return next(new ErrorHandler("Could not refresh token", 400));
      }

      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Generate new tokens using the revised methods
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user); // Optional: Generate a new refresh token

      // Define cookie options consistently with the sendToken function
      const cookieOptions = {
        httpOnly: true,
        sameSite: "lax" as const, // Ensuring type safety
        secure: process.env.NODE_ENV === "production",
      };

      // Set cookies for the new tokens
      res.cookie("access_token", accessToken, {
        ...cookieOptions,
        maxAge: minutesToFutureTimestamp(
          Number(process.env.ACCESS_TOKEN_EXPIRE)
        ),
      }); // 15 minutes
      // res.cookie("refresh_token", refreshToken, {
      //   ...cookieOptions,
      //   maxAge: 604800000,
      // }); // 7 days

      res.status(200).json({
        success: true,
        accessToken,
        expiresIn: minutesToFutureTimestamp(
          Number(process.env.ACCESS_TOKEN_EXPIRE)
        ),
      });
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 401));
      } else {
        // Fallback error handling for unexpected error types
        return next(new ErrorHandler("An unexpected error occurred", 500));
      }
    }
  }
);

//Forgot Password
export const forgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    let user;
    try {
      const { email } = req.body;
      if (!email) {
        return next(new ErrorHandler("Please provide your email address", 400));
      }

      user = await userModel.findOne({ email });

      if (!user) {
        return next(new ErrorHandler("Email could not be found", 404));
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(20).toString("hex");

      // Hash the token and set to resetPasswordToken field
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set token expiry time to 1hour
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      await user.save();
      const data = {
        token: resetPasswordToken,
        name: user.nickname,
      };
      // Send the email with the reset link
      try {
        await sendMail({
          email: user.email,
          data,
          template: "forgot-password.ejs",
          subject: "Password Reset",
        });
      } catch (err) {
        console.error("Failed to send email:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to send password reset email",
        });
      }

      res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email address.",
        resetToken,
      });
    } catch (error: any) {
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }

      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Resend Reset Password Link
export const resendResetLink = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    let user;
    if (!email) {
      return next(new ErrorHandler("Please provide your email address", 400));
    }

    user = await userModel.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("Email not found", 404));
    }

    // Check if the user already requested a password reset and the token is not expired
    if (
      user.resetPasswordToken &&
      user.resetPasswordExpire &&
      user.resetPasswordExpire > new Date()
    ) {
      // Generate a new password reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now

      await user.save();

      // Resend the email with the reset link
      const resetUrl = `${req.protocol}://${req.get(
        "host"
      )}/password-reset/${resetToken}`;

      // Call a function to send the email
      // await sendResetPasswordEmail(user.email, resetUrl);
      res.status(200).json({
        success: true,
        message: "Password reset link has been resent to your email address.",
      });
    } else {
      // If no reset request was made or the token expired, inform the user
      return next(
        new ErrorHandler(
          "No password reset request was found or the link has expired",
          400
        )
      );
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
    if (user.password !== oldPassword) {
      return next(new ErrorHandler("Invalid password", 401));
    }

    // Update the user's password with the new hashed password and new client-side generated salt
    user.password = newPassword;
    user.clientSalt = newSalt; // Assuming you store the salt used for hashing the password
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
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, salt: user.clientSalt });
  }
);

export const getUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id;
    console.log(userId);
    try {
      // Find the user based on the userId and retrieve the salt
      const user = await userModel.findById({ _id: userId });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const isEmailVerified = await EmailVerificationModel.findOne({
        userId,
      });

      const userInfo = {
        ...user.toJSON(),
        password: undefined,
        salt: undefined,
        ps: undefined,
        sgek: undefined,
        verificationToken: undefined,
        is2StepEnabled: isEmailVerified?.isForLoginEnabled,
      };

      return res.status(200).json({
        success: true,
        user: userInfo,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
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
          "-password -salt -ps -sgek -verificationToken -tokenExpiration -resetPasswordToken -resetPasswordExpire"
        );

      if (!updatedUser) {
        return next(new ErrorHandler("User not found", 404));
      }

      const userInfo = {
        ...updatedUser.toJSON(),
        password: undefined,
        salt: undefined,
        ps: undefined,
        sgek: undefined,
        verificationToken: undefined,
        tokenExpiration: undefined,
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
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
    console.log(email, password);

    // Find the user based on the email
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Compare the client-side hashed password with the stored hashed password
    if (user.password !== password) {
      return next(new ErrorHandler("Invalid password", 401));
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
