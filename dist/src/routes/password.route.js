"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const password_controller_1 = require("../controllers/password.controller");
const auth_1 = require("../middleware/auth");
const passwordRouter = express_1.default.Router();
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
passwordRouter.post("/add-password", auth_1.isAuthenticated, password_controller_1.addPassword);
passwordRouter.get("/get-password", auth_1.isAuthenticated, password_controller_1.getPassword);
passwordRouter.get("/get-password/:id", auth_1.isAuthenticated, password_controller_1.getSinglePassword);
passwordRouter.delete("/delete-password/:passwordId", auth_1.isAuthenticated, password_controller_1.deleteSinglePassword);
passwordRouter.delete("/delete-passwords", auth_1.isAuthenticated, password_controller_1.deleteMultiplePasswords);
passwordRouter.put("/update-password/:passwordId", auth_1.isAuthenticated, password_controller_1.editPassword);
exports.default = passwordRouter;
