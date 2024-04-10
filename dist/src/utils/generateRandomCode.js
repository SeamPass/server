"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionIdentifier = exports.generateRandomCode = void 0;
const crypto = require("crypto");
const generateRandomCode = (length) => {
    const randomBytes = crypto.randomBytes(length); // 3 bytes for a 6-digit code
    const code = ((parseInt(randomBytes.toString("hex"), 16) % 900000) +
        100000).toString();
    return code;
};
exports.generateRandomCode = generateRandomCode;
const generateSessionIdentifier = (length = 32) => {
    const randomBytes = crypto.randomBytes(length);
    const identifier = randomBytes.toString("hex");
    return identifier;
};
exports.generateSessionIdentifier = generateSessionIdentifier;
