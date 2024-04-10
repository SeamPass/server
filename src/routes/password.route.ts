import express from "express";
import { createRateLimiter } from "../middleware/rateLimiter";
import {
  addPassword,
  deleteMultiplePasswords,
  deleteSinglePassword,
  editPassword,
  getPassword,
  getSinglePassword,
} from "../controllers/password.controller";
import { isAuthenticated } from "../middleware/auth";

const passwordRouter = express.Router();

// For resend reset link
const resendResetLinkLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message:
    "Too many resend requests from this IP, please try again after an hour",
});

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 3, // limit each IP to 3 login attempts per 15-minute window
  message: "Try again in the next 15 minutes.",
});

passwordRouter.post("/add-password", isAuthenticated, addPassword);
passwordRouter.get("/get-password", isAuthenticated, getPassword);
passwordRouter.get("/get-password/:id", isAuthenticated, getSinglePassword);
passwordRouter.delete(
  "/delete-password/:passwordId",
  isAuthenticated,
  deleteSinglePassword
);
passwordRouter.delete(
  "/delete-passwords",
  isAuthenticated,
  deleteMultiplePasswords
);
passwordRouter.put(
  "/update-password/:passwordId",
  isAuthenticated,
  editPassword
);

export default passwordRouter;
