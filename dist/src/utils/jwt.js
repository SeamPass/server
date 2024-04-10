"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const minutesToFutureTimestamp_1 = require("./minutesToFutureTimestamp");
// Generate JWT Access and Refresh Tokens
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.ACCESS_TOKEN, {
        expiresIn: "15m",
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.REFRESH_TOKEN, {
        expiresIn: "7d",
    });
};
exports.generateRefreshToken = generateRefreshToken;
const sendToken = (user, statusCode, res
// sessionIdentifier: string
) => {
    console.log(user);
    const accessToken = (0, exports.generateAccessToken)(user.userInfo._id.toString());
    const refreshToken = (0, exports.generateRefreshToken)(user.userInfo._id.toString());
    // Options for cookies
    const cookieOptions = {
        httpOnly: true,
        sameSite: "lax", // Using 'as const' for literal types
        secure: process.env.NODE_ENV === "production",
    };
    // Set cookies for tokens
    res.cookie("access_token", accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: Number(process.env.ACCESS_TOKEN_EXPIRE) }));
    res.cookie("refresh_token", refreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: (0, minutesToFutureTimestamp_1.minutesToFutureTimestamp)(Number(process.env.REFRESH_TOKEN_EXPIRE)) }));
    // Send response with tokens
    res.status(statusCode).json(Object.assign(Object.assign({ success: true }, user), { accessToken, expiresIn: (0, minutesToFutureTimestamp_1.minutesToFutureTimestamp)(Number(process.env.ACCESS_TOKEN_EXPIRE)) }));
};
exports.sendToken = sendToken;
