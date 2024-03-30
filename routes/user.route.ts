import express from "express";
import {
  changePassword,
  forgotPassword,
  getSalt,
  getUser,
  login,
  logoutUser,
  registerUser,
  resendResetLink,
  resendVerificationLink,
  unlockUser,
  updateAccessToken,
  updateUser,
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

userRouter.post("/register-user", registerUser);
userRouter.post("/verify", verifyUser);
userRouter.post("/resend-verification-link", resendVerificationLink);
userRouter.post("/login", login);
userRouter.get("/get-salt", getSalt);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh-access-token", updateAccessToken);
userRouter.post("/forgot-password/confirm", forgotPassword);
userRouter.get("/get-user", isAuthenticated, getUser);
userRouter.patch("/update-user", isAuthenticated, updateUser);
userRouter.post("/unlock-account", isAuthenticated, unlockUser);
userRouter.post(
  "/forgot-password/resend",
  resendResetLinkLimiter,
  resendResetLink
);
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

export default userRouter;
