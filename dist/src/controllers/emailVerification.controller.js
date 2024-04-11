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
exports.verifyEmailVerificationCode = exports.disableEmailVerificationForLogin = exports.verifyEmailVerificationOnEnable = exports.enableEmailVerificationForLogin = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const emailVerification_model_1 = __importDefault(require("../models/emailVerification.model"));
const generateRandomCode_1 = require("../utils/generateRandomCode");
const jwt_1 = require("../utils/jwt");
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const encryptionKeyModel_1 = __importDefault(require("../models/encryptionKeyModel"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
exports.enableEmailVerificationForLogin = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const emailVerificationCode = (0, generateRandomCode_1.generateRandomCode)(6);
    const expirationTime = new Date(Date.now() + 3600000);
    yield emailVerification_model_1.default.findOneAndUpdate({ userId }, {
        emailVerificationCode: emailVerificationCode,
        expirationTime: expirationTime,
    }, { upsert: true, new: true });
    const user = yield user_model_1.default.findById({ _id: userId });
    // Send the verification code to the user's email
    const data = {
        code: emailVerificationCode,
        name: user === null || user === void 0 ? void 0 : user.nickname,
    };
    try {
        yield (0, sendMail_1.default)({
            email: user === null || user === void 0 ? void 0 : user.email,
            data,
            template: "enable2Step-code.ejs",
            subject: "Code",
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to send Welcome email",
        });
    }
    res.status(200).json({
        success: true,
        message: "Verification code sent. Please check your email.",
        emailVerificationCode,
    });
}));
exports.verifyEmailVerificationOnEnable = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { verificationCode } = req.body;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const emailVerification = yield emailVerification_model_1.default.findOne({ userId });
    if (!emailVerification) {
        return res.status(404).json({
            success: false,
            message: "Verification record not found.",
        });
    }
    if (verificationCode === emailVerification.emailVerificationCode &&
        emailVerification.expirationTime > new Date()) {
        emailVerification.emailVerificationCode = undefined;
        emailVerification.isForLoginEnabled = true; // Set to true after successful verification
        yield emailVerification.save();
        res.status(200).json({
            success: true,
            message: "Email verification enabled successfully.",
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: "Invalid or expired verification code.",
        });
    }
}));
exports.disableEmailVerificationForLogin = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
    yield emailVerification_model_1.default.findOneAndUpdate({ userId }, { isForLoginEnabled: false }, { new: true });
    res.status(200).json({
        success: true,
        message: "Email verification for login has been disabled.",
    });
}));
exports.verifyEmailVerificationCode = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, verificationCode } = req.body;
    // Find the user based on the email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    const emailVerification = yield emailVerification_model_1.default.findOne({
        userId: user._id,
    });
    if (!emailVerification || !emailVerification.isForLoginEnabled) {
        return res.status(404).json({
            success: false,
            message: "Two-step verification is not enabled or code not found.",
        });
    }
    // Check if the provided code matches and is not expired
    if (verificationCode === emailVerification.emailVerificationCode &&
        emailVerification.expirationTime > new Date()) {
        // Reset the verification code as it's been used
        emailVerification.emailVerificationCode = undefined;
        yield emailVerification.save();
        // Proceed to authenticate the user (e.g., issuing a JWT token)
        const userInfo = yield user_model_1.default
            .findById(user._id)
            .select("-password -twoFactorSecret -resetPasswordExpire -resetPasswordToken -verificationToken -tokenExpiration");
        const info = yield encryptionKeyModel_1.default.findOne({
            userId: user._id,
        }).lean();
        const AllInfo = {
            userInfo,
            mk: info === null || info === void 0 ? void 0 : info.mk,
            iv: info === null || info === void 0 ? void 0 : info.iv,
            salt: info === null || info === void 0 ? void 0 : info.salt,
        };
        (0, jwt_1.sendToken)(AllInfo, 200, res);
    }
    else {
        res.status(401).json({
            success: false,
            message: "Invalid or expired verification code.",
        });
    }
}));
