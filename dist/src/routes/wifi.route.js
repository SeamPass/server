"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const wifi_controller_1 = require("../controllers/wifi.controller");
const wifiRouter = express_1.default.Router();
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
wifiRouter.post("/add-wifi", auth_1.isAuthenticated, wifi_controller_1.addWifi);
wifiRouter.get("/get-wifi", auth_1.isAuthenticated, wifi_controller_1.getWifi);
wifiRouter.get("/get-wifi/:id", auth_1.isAuthenticated, wifi_controller_1.getSingleWifi);
wifiRouter.delete("/delete-wifi/:wifiId", auth_1.isAuthenticated, wifi_controller_1.deleteSingleWifi);
wifiRouter.delete("/delete-wifis", auth_1.isAuthenticated, wifi_controller_1.deleteMultipleWifi);
wifiRouter.put("/update-wifi/:wifiId", auth_1.isAuthenticated, wifi_controller_1.editWifiDetails);
exports.default = wifiRouter;
