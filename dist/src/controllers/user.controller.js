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
exports.unlockUser = exports.updateUser = exports.getUser = exports.getSalt = exports.changePassword = exports.resendResetLink = exports.forgotPassword = exports.updateAccessToken = exports.logoutUser = exports.login = exports.verifyUser = exports.resendVerificationLink = exports.registerUser = void 0;
require("dotenv").config();
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const crypto_1 = __importDefault(require("crypto"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const logger_1 = __importDefault(require("../utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateRandomCode_1 = require("../utils/generateRandomCode");
const emailVerification_model_1 = __importDefault(require("../models/emailVerification.model"));
const jwt_1 = require("../utils/jwt");
const minutesToFutureTimestamp_1 = require("../utils/minutesToFutureTimestamp");
const encryptionKeyModel_1 = __importDefault(require("../models/encryptionKeyModel"));
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
        // Generate a unique encryption key for each user
        const encryptionSalt = crypto_1.default.randomBytes(32).toString("hex");
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        // Create new user with hashed password and encrypted encryption key
        const newUser = yield user_model_1.default.create({
            nickname,
            email,
            password: hashedPassword,
            clientSalt,
            verificationToken,
            ps: encryptionSalt,
        });
        const data = {
            token: verificationToken,
            name: newUser.nickname,
        };
        try {
            yield (0, sendMail_1.default)({
                email: newUser.email,
                data,
                template: "verify-email.ejs",
                subject: "Welcome",
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to send Welcome email",
            });
        }
        // Optional: Send verification email or perform other post-registration tasks
        res.status(201).json({
            success: true,
            message: "Account created successfully. Please check your email to verify your account.",
            data: {
                id: newUser._id,
                nickname: newUser.nickname,
                email: newUser.email,
                encryptionSalt,
            },
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// export const registerUser = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { nickname, email, password } = req.body;
//       // Validation checks
//       if (!nickname || !email || !password) {
//         return next(
//           new ErrorHandler("Please provide nickname, email, and password.", 400)
//         );
//       }
//       const isEmailExist = await userModel.findOne({ email });
//       if (isEmailExist) {
//         return next(new ErrorHandler("Email already exists.", 400));
//       }
//       const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
//       if (!passwordRegex.test(password)) {
//         return next(
//           new ErrorHandler(
//             "Password must include numbers, lowercase and uppercase letters, and be at least 8 characters long.",
//             400
//           )
//         );
//       }
//       // Generate salt and hash the password
//       const salt = generateSalt();
//       const hashedPassword = await hashPassword(password, salt);
//       // Generate a unique encryption key for each user
//       const encryptionKey = crypto.randomBytes(32).toString("hex");
//       const esalt = generateSalt(); // Generate a separate salt for encryption
//       const encryptedEncryptionKey = encrypt(
//         encryptionKey,
//         hashedPassword,
//         esalt
//       );
//       const verificationToken = crypto.randomBytes(32).toString("hex");
//       // Create new user with hashed password and encrypted encryption key
//       const newUser = await userModel.create({
//         nickname,
//         email,
//         password: hashedPassword,
//         salt,
//         encryptedEncryptionKey,
//         esalt,
//         verificationToken,
//       });
//       const data = {
//         token: verificationToken,
//         name: newUser.nickname,
//       };
//       try {
//         await sendMail({
//           email: newUser.email,
//           data,
//           template: "verify-email.ejs",
//           subject: "Welcome",
//         });
//       } catch (err) {
//         console.error("Failed to send email:", err);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to send Welcome email",
//         });
//       }
//       // Optional: Send verification email or perform other post-registration tasks
//       res.status(201).json({
//         success: true,
//         message:
//           "Account created successfully. Please check your email to verify your account.",
//         data: {
//           id: newUser._id,
//           nickname: newUser.nickname,
//           email: newUser.email,
//         },
//       });
//     } catch (error: any) {
//       next(new ErrorHandler(error.message, 500));
//     }
//   }
// );
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
        return res.status(200).json({
            success: true,
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
    };
    // Send the email with the reset link
    try {
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to send password reset email",
        });
    }
    // Resend the email
    try {
        /////
        res.status(200).json({
            success: true,
            message: "Verification link has been resent to your email address.",
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default("Failed to send verification email", 500));
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
        const user = yield user_model_1.default.findOne({
            verificationToken: token,
            tokenExpiration: { $gt: new Date() }, // Check if the token is not expired
        });
        if (!user) {
            res.status(400);
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
        // Send email (uncomment this section if needed)
        /*
          sendMail({
            email: user.email,
            template: "verification-successful.ejs",
            subject: "Verification Successful",
          });
          */
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
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Compare the client-side hashed password with the stored hashed password
    if (user.password !== password) {
        return next(new ErrorHandler_1.default("Invalid password", 401));
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
        // TODO: Implement sendVerificationEmail function to send the code
        // await sendVerificationEmail(user.email, tempCode);
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
//Logout User
exports.logoutUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie("access_token", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1,
        });
        res.cookie("refresh_token", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1,
        });
        res.json({ success: true, message: "Logged out successfully" });
        // Optional: Log the user logout action
        // Assuming logger is defined and you can obtain the user ID from the request (if the user was authenticated)
        // logger.info(`User ID: ${req.user?._id} logged out`);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//Update access token
exports.updateAccessToken = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) {
            return next(new ErrorHandler_1.default("Refresh token is required", 400));
        }
        // Verify the refresh token
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        if (!decoded.id) {
            return next(new ErrorHandler_1.default("Could not refresh token", 400));
        }
        const user = yield user_model_1.default.findById(decoded.id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // Generate new tokens using the revised methods
        const accessToken = (0, jwt_1.generateAccessToken)(user);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user); // Optional: Generate a new refresh token
        // Define cookie options consistently with the sendToken function
        const cookieOptions = {
            httpOnly: true,
            sameSite: "lax", // Ensuring type safety
            secure: process.env.NODE_ENV === "production",
        };
        // Set cookies for the new tokens
        res.cookie("access_token", accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: (0, minutesToFutureTimestamp_1.minutesToFutureTimestamp)(Number(process.env.ACCESS_TOKEN_EXPIRE)) })); // 15 minutes
        // res.cookie("refresh_token", refreshToken, {
        //   ...cookieOptions,
        //   maxAge: 604800000,
        // }); // 7 days
        res.status(200).json({
            success: true,
            accessToken,
            expiresIn: (0, minutesToFutureTimestamp_1.minutesToFutureTimestamp)(Number(process.env.ACCESS_TOKEN_EXPIRE)),
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return next(new ErrorHandler_1.default(error.message, 401));
        }
        else {
            // Fallback error handling for unexpected error types
            return next(new ErrorHandler_1.default("An unexpected error occurred", 500));
        }
    }
}));
//Forgot Password
exports.forgotPassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let user;
    try {
        const { email } = req.body;
        if (!email) {
            return next(new ErrorHandler_1.default("Please provide your email address", 400));
        }
        user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return next(new ErrorHandler_1.default("Email could not be found", 404));
        }
        // Generate password reset token
        const resetToken = crypto_1.default.randomBytes(20).toString("hex");
        // Hash the token and set to resetPasswordToken field
        const resetPasswordToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        // Set token expiry time to 1hour
        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        yield user.save();
        const data = {
            token: resetPasswordToken,
            name: user.nickname,
        };
        // Send the email with the reset link
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                data,
                template: "forgot-password.ejs",
                subject: "Password Reset",
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to send password reset email",
            });
        }
        res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email address.",
            resetToken,
        });
    }
    catch (error) {
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            yield user.save({ validateBeforeSave: false });
        }
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//Resend Reset Password Link
exports.resendResetLink = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    let user;
    if (!email) {
        return next(new ErrorHandler_1.default("Please provide your email address", 400));
    }
    user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("Email not found", 404));
    }
    // Check if the user already requested a password reset and the token is not expired
    if (user.resetPasswordToken &&
        user.resetPasswordExpire &&
        user.resetPasswordExpire > new Date()) {
        // Generate a new password reset token
        const resetToken = crypto_1.default.randomBytes(20).toString("hex");
        const resetPasswordToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now
        yield user.save();
        // Resend the email with the reset link
        const resetUrl = `${req.protocol}://${req.get("host")}/password-reset/${resetToken}`;
        // Call a function to send the email
        // await sendResetPasswordEmail(user.email, resetUrl);
        res.status(200).json({
            success: true,
            message: "Password reset link has been resent to your email address.",
        });
    }
    else {
        // If no reset request was made or the token expired, inform the user
        return next(new ErrorHandler_1.default("No password reset request was found or the link has expired", 400));
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
        if (user.password !== oldPassword) {
            return next(new ErrorHandler_1.default("Invalid password", 401));
        }
        // Update the user's password with the new hashed password and new client-side generated salt
        user.password = newPassword;
        user.clientSalt = newSalt; // Assuming you store the salt used for hashing the password
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
    const user = yield user_model_1.default.findOne({ email: email });
    if (!user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found." });
    }
    res.json({ success: true, salt: user.clientSalt });
}));
exports.getUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id;
    try {
        // Find the user based on the userId and retrieve the salt
        const user = yield user_model_1.default.findById({ _id: userId });
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        const isEmailVerified = yield emailVerification_model_1.default.findOne({
            userId,
        });
        const userInfo = Object.assign(Object.assign({}, user.toJSON()), { password: undefined, salt: undefined, ps: undefined, sgek: undefined, verificationToken: undefined, is2StepEnabled: isEmailVerified === null || isEmailVerified === void 0 ? void 0 : isEmailVerified.isForLoginEnabled });
        return res.status(200).json({
            success: true,
            user: userInfo,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.updateUser = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const userId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c._id;
    const { nickname, email } = req.body;
    try {
        const updatedUser = yield user_model_1.default
            .findByIdAndUpdate(userId, { nickname, email }, { new: true, runValidators: true })
            .select("-password -salt -ps -sgek -verificationToken -tokenExpiration -resetPasswordToken -resetPasswordExpire");
        if (!updatedUser) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        const userInfo = Object.assign(Object.assign({}, updatedUser.toJSON()), { password: undefined, salt: undefined, ps: undefined, sgek: undefined, verificationToken: undefined, tokenExpiration: undefined, resetPasswordToken: undefined, resetPasswordExpire: undefined });
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
    if (user.password !== password) {
        return next(new ErrorHandler_1.default("Invalid password", 401));
    }
    const info = yield encryptionKeyModel_1.default.findOne({
        userId: user._id,
    }).lean();
    // Inform the user that a verification code has been sent
    return res.status(200).json(Object.assign(Object.assign({ success: true }, info), { message: "Account Unlocked" }));
}));
