import express from "express";
import { createRateLimiter } from "../middleware/rateLimiter";
import { isAuthenticated } from "../middleware/auth";
import {
  addSecretNote,
  deleteMultipleSecretNote,
  deleteSingleSecretNote,
  editSecretNote,
  getSecretNote,
  getSingleNote,
} from "../controllers/secret.controller";

const secretRouter = express.Router();

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

secretRouter.post("/add-secret", isAuthenticated, addSecretNote);
secretRouter.get("/get-secret", isAuthenticated, getSecretNote);
secretRouter.get("/get-secret/:id", isAuthenticated, getSingleNote);
secretRouter.delete(
  "/delete-secret/:secretId",
  isAuthenticated,
  deleteSingleSecretNote
);
secretRouter.delete(
  "/delete-secrets",
  isAuthenticated,
  deleteMultipleSecretNote
);
secretRouter.put("/update-secret/:id", isAuthenticated, editSecretNote);

export default secretRouter;
