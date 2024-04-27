"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const minutesToFutureTimestamp_1 = require("./minutesToFutureTimestamp");
// Generate JWT Access and Refresh Tokens
const generateAccessToken = (id) => {
    return jsonwebtoken_1.default.sign({ _id: id }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
    });
};
exports.generateAccessToken = generateAccessToken;
// export const generateRefreshToken = (id: string): string => {
//   return jwt.sign({ _id: id }, process.env.REFRESH_TOKEN!, {
//     expiresIn: "1m",
//   });
// };
const sendToken = (user, statusCode, res) => {
    const accessToken = (0, exports.generateAccessToken)(user.userInfo._id.toString());
    // const refreshToken = generateRefreshToken(user.userInfo._id.toString());
    console.log(process.env.ACCESS_TOKEN_EXPIRE);
    // Send response with tokens
    res.status(statusCode).json(Object.assign(Object.assign({ success: true }, user), { accessToken, 
        // refreshToken,
        expiresIn: (0, minutesToFutureTimestamp_1.minutesToFutureTimestamp)(Number(process.env.ACCESS_TOKEN_EXPIRE)) }));
};
exports.sendToken = sendToken;
