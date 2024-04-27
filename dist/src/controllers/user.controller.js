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
exports.getUser = exports.uploadProfileImage = exports.unlockUser = exports.updateUser = exports.getSalt = exports.changePassword = exports.resendOtp = exports.login = exports.verifyUser = exports.resendVerificationLink = exports.registerUser = void 0;
require("dotenv").config();
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
const generateRandomCode_1 = require("../utils/generateRandomCode");
const emailVerification_model_1 = __importDefault(require("../models/emailVerification.model"));
const jwt_1 = require("../utils/jwt");
const encryptionKeyModel_1 = __importDefault(require("../models/encryptionKeyModel"));
const sharp_1 = __importDefault(require("sharp"));
const s3_1 = __importDefault(require("../utils/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const sendMail_1 = __importDefault(require("../utils/sendMail"));
exports.registerUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nickname, email, hashedPassword, clientSalt } = req.body;
        // Validation checks
        if (!nickname || !email || !hashedPassword || !clientSalt) {
            return next(new ErrorHandler_1.default("Please provide nickname, email, and password.", 400));
        }
        const isEmailExist = yield user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists.", 400));
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const currentTime = new Date();
        let tokenExpiration = new Date(currentTime.getTime() + 3600000);
        // Create new user with hashed password and encrypted encryption key
        const newUser = yield user_model_1.default.create({
            nickname,
            email,
            password: hashedPassword,
            clientSalt,
            verificationToken,
            tokenExpiration,
        });
        const data = {
            token: verificationToken,
            name: newUser.nickname,
            email: newUser.email,
        };
        yield (0, sendMail_1.default)({
            email: newUser.email,
            data,
            template: "verify-email.ejs",
            subject: "Welcome",
        });
        //Send verification email
        res.status(201).json({
            success: true,
            message: "Account created successfully. Please check your email to verify your account.",
            data: {
                id: newUser._id,
                nickname: newUser.nickname,
                email: newUser.email,
            },
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.resendVerificationLink = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler_1.default("Please provide your email address", 400));
    }
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("Email not found", 404));
    }
    if (user.isVerified) {
        return res.status(400).json({
            success: false,
            message: "Your account is already verified.",
        });
    }
    // Generate a new verification token
    const newVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
    user.verificationToken = newVerificationToken;
    user.tokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now
    yield user.save();
    const data = {
        token: newVerificationToken,
        name: user.nickname,
        email: user.email,
    };
    // Send the email with the verification link
    try {
        yield (0, sendMail_1.default)({
            email: user.email,
            data,
            template: "verify-email.ejs",
            subject: "Verify Your Email Address",
        });
        res.status(200).json({
            success: true,
            message: "Verification link has been resent to your email address.",
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to send verification email.",
        });
    }
}));
// VERIFY USER
exports.verifyUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400);
            return next(new ErrorHandler_1.default("Token is missing", 400));
        }
        console.log(token);
        const user = yield user_model_1.default.findOne({
            verificationToken: token,
            tokenExpiration: { $gt: new Date() }, // Check if the token is not expired
        });
        if (!user) {
            return next(new ErrorHandler_1.default("User does not exist or the token has expired. Please request a new verification link.", 400));
        }
        user.isVerified = true;
        // Clear the reset token and expiration
        user.verificationToken = undefined;
        // Clear the expiration time
        user.tokenExpiration = undefined;
        // Save the user with the new password
        yield user.save();
        // Log the successful email verification
        logger_1.default.info(`Email verified for user ID: ${user._id}`);
        // Send email
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                data: { nickname: user.nickname },
                template: "email-verified.ejs",
                subject: "Verification Successful",
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to send Email verified",
            });
        }
        // Response to the client
        res
            .status(200)
            .json({ success: true, message: "Your account has been verified" });
    }
    catch (error) {
        // Handle errors and pass them to the error handling middleware
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//Login the user
exports.login = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Find the user based on the email
    const user = yield user_model_1.default.findOne({ email }).select("+password");
    console.log(user);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Compare the client-side hashed password with the stored hashed password
    const isCorrectPassword = yield user.comparePassword(password);
    if (!isCorrectPassword) {
        return next(new ErrorHandler_1.default("Incorrect password ", 400));
    }
    if (!user.isVerified) {
        return next(new ErrorHandler_1.default("Please verify your account before proceeding to login", 400));
    }
    // Check if two-step verification is enabled for the user
    const emailVerification = yield emailVerification_model_1.default.findOne({
        userId: user._id,
    });
    if (emailVerification && emailVerification.isForLoginEnabled) {
        // Generate a new verification code
        const tempCode = (0, generateRandomCode_1.generateRandomCode)(6);
        emailVerification.emailVerificationCode = tempCode;
        emailVerification.expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration
        yield emailVerification.save();
        // Send the code to the user's email
        const data = {
            code: tempCode,
        };
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                template: "login-code.ejs",
                data,
                subject: "OTP",
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to send Email verified",
            });
        }
        // Inform the user that a verification code has been sent
        return res.status(200).json({
            success: true,
            message: "Please verify the code sent to your email.",
            tempCode,
            is2StepEnabled: emailVerification.isForLoginEnabled,
        });
    }
    else {
        // If two-step verification is not enabled, proceed with normal login
        const userInfo = yield user_model_1.default
            .findOne({ email })
            .select("-password -twoFactorSecret -resetPasswordExpire -salt -esalt -encryptedEncryptionKey -resetPasswordToken -verificationToken  -tokenExpiration");
        // Generate a unique identifier for the session
        const info = yield encryptionKeyModel_1.default.findOne({
            userId: user._id,
        }).lean();
        console.log(info);
        const AllInfo = {
            userInfo,
            mk: info === null || info === void 0 ? void 0 : info.mk,
            iv: info === null || info === void 0 ? void 0 : info.iv,
            salt: info === null || info === void 0 ? void 0 : info.salt,
            is2StepEnabled: emailVerification === null || emailVerification === void 0 ? void 0 : emailVerification.isForLoginEnabled,
        };
        (0, jwt_1.sendToken)(AllInfo, 200, res);
    }
}));
//Resend User OTP
exports.resendOtp = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Find the user based on the email
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 400));
    }
    try {
        // Check if two-step verification is enabled for the user
        const emailVerification = yield emailVerification_model_1.default.findOne({
            userId: user._id,
        });
        if (emailVerification && emailVerification.isForLoginEnabled) {
            // Generate a new verification code
            const tempCode = (0, generateRandomCode_1.generateRandomCode)(6);
            emailVerification.emailVerificationCode = tempCode;
            emailVerification.expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration
            yield emailVerification.save();
            // Send the code to the user's email
            const data = {
                code: tempCode,
            };
            try {
                yield (0, sendMail_1.default)({
                    email: user.email,
                    template: "login-code.ejs",
                    data,
                    subject: "OTP",
                });
                // Inform the user that a verification code has been sent
                return res.status(200).json({
                    success: true,
                    message: "Please verify the code sent to your email.",
                    tempCode,
                    is2StepEnabled: emailVerification.isForLoginEnabled,
                });
            }
            catch (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send Email verified",
                });
            }
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { oldPassword, newPassword, confirmNewPassword, newSalt } = req.body;
        if (!oldPassword || !newPassword || !confirmNewPassword || !newSalt) {
            return next(new ErrorHandler_1.default("Please provide all required fields", 400));
        }
        if (newPassword !== confirmNewPassword) {
            return next(new ErrorHandler_1.default("Passwords do not match", 400));
        }
        // Fetch the user document from the database
        const user = yield user_model_1.default.findById(userId).select("+password +salt");
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // Compare the client-side hashed password with the stored hashed password
        const isCorrectPassword = yield user.comparePassword(oldPassword);
        if (!isCorrectPassword) {
            return next(new ErrorHandler_1.default("Incorrect password ", 400));
        }
        // Update the user's password with the new hashed password and new client-side generated salt
        user.password = newPassword;
        user.clientSalt = newSalt;
        yield user.save();
        const info = yield encryptionKeyModel_1.default.findOne({
            userId: user._id,
        }).lean();
        res.status(200).json(Object.assign({ success: true, message: "Password changed successfully." }, info));
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.changePassword = changePassword;
exports.getSalt = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.query;
    console.log("email", email);
    const user = yield user_model_1.default.findOne({ email: email });
    console.log(user);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found.", 400));
    }
    res.json({ success: true, salt: user.clientSalt });
}));
exports.updateUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id;
    const { nickname, email } = req.body;
    try {
        const updatedUser = yield user_model_1.default
            .findByIdAndUpdate(userId, { nickname, email }, { new: true, runValidators: true })
            .select("-password -salt -ps -sek -verificationToken -tokenExpiration -resetPasswordToken -resetPasswordExpire");
        if (!updatedUser) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        const userInfo = Object.assign(Object.assign({}, updatedUser.toJSON()), { password: undefined, salt: undefined, ps: undefined, sek: undefined, verificationToken: undefined, tokenExpiration: undefined });
        return res.status(200).json({
            success: true,
            message: "User profile updated",
            user: userInfo,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.unlockUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Find the user based on the email
    const user = yield user_model_1.default.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Compare the client-side hashed password with the stored hashed password
    const isCorrectPassword = yield user.comparePassword(password);
    if (!isCorrectPassword) {
        return next(new ErrorHandler_1.default("Incorrect password ", 400));
    }
    const info = yield encryptionKeyModel_1.default.findOne({
        userId: user._id,
    }).lean();
    // Inform the user that a verification code has been sent
    return res.status(200).json(Object.assign(Object.assign({ success: true }, info), { message: "Account Unlocked" }));
}));
const s3BucketName = process.env.S3_BUCKET_NAME;
const imageName = (0, generateRandomCode_1.generateSessionIdentifier)();
exports.uploadProfileImage = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    try {
        const buffer = yield (0, sharp_1.default)((_c = req.file) === null || _c === void 0 ? void 0 : _c.buffer)
            .resize({ height: 500, width: 500, fit: "cover" })
            .toBuffer();
        const params = {
            Bucket: s3BucketName,
            Key: imageName,
            Body: buffer,
            ContentType: (_d = req.file) === null || _d === void 0 ? void 0 : _d.mimetype,
        };
        const command = new client_s3_1.PutObjectCommand(params);
        yield s3_1.default.send(command);
        const updatedUser = yield user_model_1.default.findOneAndUpdate({ _id: req.user._id }, { avatar: imageName }, { new: true });
        if (!updatedUser) {
            return res.status(404).send("User not found.");
        }
        res.status(200).send({
            success: true,
            message: "Profile picture uploaded successfully.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.getUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req === null || req === void 0 ? void 0 : req.user) === null || _e === void 0 ? void 0 : _e._id;
    try {
        const user = yield user_model_1.default.findById(userId);
        const emailVerification = yield emailVerification_model_1.default.findOne({
            userId,
        });
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        let avatarUrl = "";
        if (user === null || user === void 0 ? void 0 : user.avatar) {
            const getObjectParams = {
                Bucket: s3BucketName,
                Key: user.avatar,
            };
            const command = new client_s3_1.GetObjectCommand(getObjectParams);
            avatarUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3_1.default, command, { expiresIn: 3600 });
        }
        const is2StepEnabled = emailVerification
            ? emailVerification.isForLoginEnabled
            : false;
        const userInfo = Object.assign(Object.assign({}, user.toJSON()), { password: undefined, salt: undefined, ps: undefined, sek: undefined, verificationToken: undefined, is2StepEnabled, avatar: avatarUrl });
        return res.status(200).json({
            success: true,
            user: userInfo,
            is2StepEnabled,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
