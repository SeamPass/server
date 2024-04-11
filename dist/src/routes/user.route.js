"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const emailVerification_controller_1 = require("../controllers/emailVerification.controller");
const userRouter = express_1.default.Router();
// For resend reset link
const resendResetLinkLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Too many resend requests from this IP, please try again after an hour",
});
const loginRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: 3, // limit each IP to 3 login attempts per 15-minute window
    message: "Try again in the next 15 minutes.",
});
userRouter.post("/register-user", user_controller_1.registerUser);
userRouter.post("/verify", user_controller_1.verifyUser);
userRouter.post("/resend-verification-link", user_controller_1.resendVerificationLink);
userRouter.post("/login", user_controller_1.login);
userRouter.get("/get-salt", user_controller_1.getSalt);
userRouter.get("/logout", auth_1.isAuthenticated, user_controller_1.logoutUser);
userRouter.get("/refresh-access-token", user_controller_1.updateAccessToken);
userRouter.post("/forgot-password/confirm", user_controller_1.forgotPassword);
userRouter.get("/get-user", auth_1.isAuthenticated, user_controller_1.getUser);
userRouter.patch("/update-user", auth_1.isAuthenticated, user_controller_1.updateUser);
userRouter.post("/unlock-account", auth_1.isAuthenticated, user_controller_1.unlockUser);
userRouter.post("/forgot-password/resend", resendResetLinkLimiter, user_controller_1.resendResetLink);
userRouter.post("/change-password", auth_1.isAuthenticated, user_controller_1.changePassword);
userRouter.post("/enable2Step", auth_1.isAuthenticated, emailVerification_controller_1.enableEmailVerificationForLogin);
userRouter.post("/disable2Step", auth_1.isAuthenticated, emailVerification_controller_1.disableEmailVerificationForLogin);
userRouter.post("/verify-code", auth_1.isAuthenticated, emailVerification_controller_1.verifyEmailVerificationOnEnable);
userRouter.post("/verify-login-code", emailVerification_controller_1.verifyEmailVerificationCode);
exports.default = userRouter;
