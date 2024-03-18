import express from "express";
import { createRateLimiter } from "../middleware/rateLimiter";
import { isAuthenticated } from "../middleware/auth";
import {
  retrieveEncryptedSGEK,
  storeEncryptedSGEK,
} from "../controllers/encryptionKey.controller";

const encryptionKeyRouter = express.Router();

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

encryptionKeyRouter.post("/store-sgek", storeEncryptedSGEK);
encryptionKeyRouter.get(
  "/retrieve-sgek",
  isAuthenticated,
  retrieveEncryptedSGEK
);

export default encryptionKeyRouter;
