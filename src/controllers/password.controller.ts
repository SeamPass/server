import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import PasswordModel from "../models/password.model";
import { paginate } from "../utils/pagination";

export const addPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        websiteName,
        websiteUrl,
        username,
        password,
        usernameIv,
        passwordIv,
        passwordStrength,
      } = req.body;
      const userId = (req.user as any)?._id;

      // // Check if the password already exists in the vault
      // const existingPassword = await PasswordModel.findOne({
      //   user: userId,
      //   websiteName,
      //   url: websiteUrl,
      // });

      // if (existingPassword) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Password already exists in the vault.",
      //   });
      // }

      const details = await PasswordModel.create({
        user: userId,
        websiteName,
        url: websiteUrl,
        username: { encUsername: username, iv: usernameIv },
        password: { encPassword: password, iv: passwordIv },
        passwordStrength,
      });

      await details.save();

      // Set response status to 201
      res.status(201).json({
        success: true,
        message: "Password information added successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerms = req.query.search as string;

    const searchFields = ["websiteName"];

    // Retrieve all passwords for the user with pagination
    const { results: passwords, pageInfo } = await paginate(
      PasswordModel,
      { user: userId },
      searchTerms,
      searchFields,
      { page, limit }
    );

    if (!passwords.length) {
      return res.status(200).json({
        success: true,
        ...pageInfo,
        data: [],
      });
    }

    const passwordsForClient = passwords.map((passwordEntry: any) => ({
      id: passwordEntry._id,
      websiteName: passwordEntry.websiteName,
      url: passwordEntry.url,
      username: passwordEntry.username,
      password: passwordEntry.password,
      passwordStrength: passwordEntry.passwordStrength,
      websiteNameIv: passwordEntry.websiteNameIv,
      urlIv: passwordEntry.urlIv,
      usernameIv: passwordEntry.usernameIv,
      passwordIv: passwordEntry.passwordIv,
    }));

    res.status(201).json({
      success: true,
      ...pageInfo,
      data: passwordsForClient,
    });
  }
);

export const getSinglePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req?.user?._id;
      const password = await PasswordModel.findOne({ _id: id, user: userId });

      if (!password) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      res.json({ success: true, data: password });
    } catch (error) {
      next(error);
    }
  }
);

export const editPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { passwordId } = req.params;

    const updates = req.body;
    const userId = (req.user as any)?._id;

    const updatedPassword = await PasswordModel.findOneAndUpdate(
      { _id: passwordId, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedPassword) {
      return next(
        new ErrorHandler("Password not found or not owned by the user", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);

export const deleteSinglePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?._id as string;
    const { passwordId } = req.params;

    try {
      if (!passwordId) {
        return next(new ErrorHandler("Password ID is required.", 400));
      }

      const deletionResult = await PasswordModel.deleteOne({
        _id: passwordId,
        user: userId,
      });

      if (deletionResult.deletedCount === 0) {
        return next(
          new ErrorHandler("Password not found or not owned by the user.", 404)
        );
      }

      res.status(200).json({
        success: true,
        message: "Password has been successfully deleted.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteMultiplePasswords = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?._id;
    const { passwordIds } = req.body;
    try {
      if (!Array.isArray(passwordIds) || passwordIds.length === 0) {
        return next(
          new ErrorHandler("An array of password IDs is required.", 400)
        );
      }

      const deletionResult = await PasswordModel.deleteMany({
        _id: { $in: passwordIds },
        user: userId,
      });

      if (deletionResult.deletedCount === 0) {
        return next(
          new ErrorHandler(
            "No passwords were deleted. They may not exist or not be owned by the user.",
            404
          )
        );
      }

      res.status(200).json({
        success: true,
        message: `${deletionResult.deletedCount} passwords have been successfully deleted.`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
