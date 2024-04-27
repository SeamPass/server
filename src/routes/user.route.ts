import express from "express";
import {
  changePassword,
  getSalt,
  getUser,
  login,
  registerUser,
  resendOtp,
  resendVerificationLink,
  unlockUser,
  updateUser,
  uploadProfileImage,
  verifyUser,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rateLimiter";
import {
  disableEmailVerificationForLogin,
  enableEmailVerificationForLogin,
  verifyEmailVerificationCode,
  verifyEmailVerificationOnEnable,
} from "../controllers/emailVerification.controller";
import multer from "multer";

const userRouter = express.Router();

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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

userRouter.post("/register-user", registerUser);
userRouter.post("/verify", verifyUser);
userRouter.post("/resend-verification-link", resendVerificationLink);
userRouter.post("/login", login);
userRouter.get("/get-salt", getSalt);
userRouter.get("/get-user", isAuthenticated, getUser);
userRouter.patch("/update-user", isAuthenticated, updateUser);
userRouter.post("/unlock-account", isAuthenticated, unlockUser);
userRouter.post("/change-password", isAuthenticated, changePassword);
userRouter.post(
  "/enable2Step",
  isAuthenticated,
  enableEmailVerificationForLogin
);

userRouter.post(
  "/disable2Step",
  isAuthenticated,
  disableEmailVerificationForLogin
);
userRouter.post(
  "/verify-code",
  isAuthenticated,
  verifyEmailVerificationOnEnable
);
userRouter.post("/verify-login-code", verifyEmailVerificationCode);
userRouter.post("/resend-otp", resendOtp);
userRouter.post(
  "/upload",
  upload.single("avatar"),
  isAuthenticated,
  uploadProfileImage
);

export default userRouter;
