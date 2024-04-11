"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
function createRateLimiter({ windowMs, max, message, }) {
    return (0, express_rate_limit_1.default)({
        windowMs: windowMs, // window in milliseconds
        max: max, // limit each IP to max requests per windowMs
        message: message || "Too many requests from this IP, please try again later",
    });
}
exports.createRateLimiter = createRateLimiter;
