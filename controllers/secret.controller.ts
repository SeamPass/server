import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAyncError";
import ErrorHandler from "../utils/ErrorHandler";
import SecretModel from "../models/secret.model";
import { paginate } from "../utils/pagination";

export const addSecretNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, note } = req.body;
    const userId = req.user?._id;

    if (!title || !note) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    await SecretModel.create({
      user: userId,
      title,
      note,
    });

    res.status(201).json({
      success: true,
      message: "Secret note added successfully.",
    });
  }
);

export const getSecretNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerms = req.query.search as string;

    const searchFields = ["title"];

    // Retrieve all notes for the user with pagination
    const { results: notes, pageInfo } = await paginate(
      SecretModel,
      { user: userId },
      searchTerms,
      searchFields,
      { page, limit }
    );

    if (!notes.length) {
      return next(new ErrorHandler("No notes found", 404));
    }

    const notesForClient = notes.map((secretEntry: any) => ({
      id: secretEntry._id,
      title: secretEntry.title,
      note: secretEntry.note,
      createdAt: secretEntry.createdAt,
      updatedAt: secretEntry.updatedAt,
    }));

    res.status(200).json({
      success: true,
      ...pageInfo,
      data: notesForClient,
    });
  }
);

export const getSingleNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req?.user?._id;
      const note = await SecretModel.findOne({ _id: id, user: userId });

      if (!note) {
        return next(
          new ErrorHandler("Secret note not found or access denied.", 404)
        );
      }

      res.json({ success: true, data: note });
    } catch (error) {
      console.error("Failed to get note:", error);
      next(error);
    }
  }
);

export const editSecretNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { noteId } = req.params;
    const updates = req.body;
    const userId = req.user?._id;

    const updatedNote = await SecretModel.findOneAndUpdate(
      { _id: noteId, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return next(
        new ErrorHandler("Secret note not found or not owned by the user", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Secret note updated successfully",
      data: updatedNote,
    });
  }
);

export const deleteSingleSecretNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { secretId } = req.params;

    if (!secretId) {
      return next(new ErrorHandler("Secret ID is required.", 400));
    }

    const deletionResult = await SecretModel.deleteOne({
      _id: secretId,
      user: userId,
    });

    if (deletionResult.deletedCount === 0) {
      return next(
        new ErrorHandler("Secret note not found or not owned by the user.", 404)
      );
    }

    res.status(200).json({
      success: true,
      message: "Secret note has been successfully deleted.",
    });
  }
);

export const deleteMultipleSecretNote = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { secretIds } = req.body;

    if (!Array.isArray(secretIds) || secretIds.length === 0) {
      return next(
        new ErrorHandler("An array of secret note IDs is required.", 400)
      );
    }

    const deletionResult = await SecretModel.deleteMany({
      _id: { $in: secretIds },
      user: userId,
    });

    if (deletionResult.deletedCount === 0) {
      return next(
        new ErrorHandler(
          "No secrets note were deleted. They may not exist or not be owned by the user.",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      message: `${deletionResult.deletedCount} Secret notes have been successfully deleted.`,
    });
  }
);
