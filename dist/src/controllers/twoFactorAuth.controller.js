"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify2FA = exports.enable2fa = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const twoFactorAuth_model_1 = __importDefault(require("../models/twoFactorAuth.model"));
const twoFactorAuth_1 = require("../utils/twoFactorAuth");
const user_model_1 = __importDefault(require("../models/user.model"));
const generateRandomCode_1 = require("../utils/generateRandomCode");
exports.enable2fa = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // Assuming you have the user's ID from the session or JWT
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        // Check if the user already has 2FA setup
        let twoFactorSetup = yield twoFactorAuth_model_1.default.findOne({ userId });
        if (!twoFactorSetup) {
            // If no 2FA setup, create a new one
            const newSecret = (0, twoFactorAuth_1.generate2FASecret)(userEmail);
            // Generate backup codes (example: 10 codes)
            const backupCodes = [];
            for (let i = 0; i < 10; i++) {
                backupCodes.push((0, generateRandomCode_1.generateRandomCode)(6));
            }
            twoFactorSetup = new twoFactorAuth_model_1.default({
                userId: userId,
                secret: newSecret.secret,
                isEnabled: true,
                backupCodes: backupCodes,
                recoveryEmail: req.body.recoveryEmail, // Include the provided recovery email
                createdAt: new Date(), // Set the creation date
                lastUsed: null, // Initialize last used as null
                // Add any additional fields if needed
            });
            yield twoFactorSetup.save();
            res.json({
                secret: newSecret.secret,
                qrCode: newSecret.qr,
                backupCodes: backupCodes,
            });
        }
        else if (!twoFactorSetup.isEnabled) {
            // If 2FA setup exists but not enabled, enable it
            const newSecret = (0, twoFactorAuth_1.generate2FASecret)(userEmail);
            // Generate backup codes (example: 10 codes)
            const backupCodes = [];
            for (let i = 0; i < 10; i++) {
                backupCodes.push((0, generateRandomCode_1.generateRandomCode)(6));
            }
            twoFactorSetup.secret = newSecret.secret;
            twoFactorSetup.isEnabled = true;
            twoFactorSetup.backupCodes = backupCodes;
            twoFactorSetup.recoveryEmail = req.body.recoveryEmail; // Update the recovery email
            twoFactorSetup.createdAt = new Date(); // Update the creation date
            yield twoFactorSetup.save();
            res.json({
                secret: newSecret.secret,
                qrCode: newSecret.qr,
                backupCodes,
            });
        }
        else {
            res.status(400).json({ message: "2FA is already enabled." });
        }
    }
    catch (error) {
        // handle errors
        next(error);
    }
}));
exports.verify2FA = (0, catchAyncError_1.CatchAsyncError)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token } = req.body;
    // Fetch user from userModel to get the user ID
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Fetch 2FA details from TwoFactorModel using the user's ID
    const twoFactorDetails = yield twoFactorAuth_model_1.default.findOne({ userId: user._id });
    if (!twoFactorDetails) {
        return res
            .status(404)
            .json({ message: "2FA details not found for this user" });
    }
    if (!twoFactorDetails.isEnabled) {
        return res
            .status(400)
            .json({ message: "2FA is not enabled for this user." });
    }
    const verified = (0, twoFactorAuth_1.verify2FAToken)(twoFactorDetails.secret, token);
    if (verified) {
        // 2FA token is correct, proceed to log the user in or perform the intended action
        res.json({ message: "2FA token verified successfully." });
    }
    else {
        res.status(401).json({ message: "Invalid 2FA token" });
    }
}));
