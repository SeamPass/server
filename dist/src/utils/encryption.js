"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.deriveKey = void 0;
const crypto = __importStar(require("crypto"));
// Helper function to convert Buffer to Base64
function bufferToBase64(buffer) {
    return buffer.toString("base64");
}
// Helper function to convert Base64 to Buffer
function base64ToBuffer(base64) {
    return Buffer.from(base64, "base64");
}
// Function to derive a key using PBKDF2 from a password and salt
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}
exports.deriveKey = deriveKey;
// Encrypts the given plaintext using AES-256-CBC with PBKDF2 key derivation
function encrypt(plaintext, key) {
    const iv = crypto.randomBytes(16); // Generate a random IV
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const ivBase64 = bufferToBase64(iv);
    return `${ivBase64}:${encrypted}`; // Return IV and encrypted data in Base64
}
exports.encrypt = encrypt;
// Decrypts the given ciphertext using AES-256-CBC with PBKDF2 key derivation
function decrypt(ciphertext, ivBase64, keyBase64) {
    const iv = base64ToBuffer(ivBase64);
    const key = base64ToBuffer(keyBase64); // Assuming the key is provided as a Base64 string
    // Assuming ciphertext is also provided as a Base64-encoded string
    const encryptedText = base64ToBuffer(ciphertext);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = Buffer.concat([
        decipher.update(encryptedText), // "base64" removed as input is now a buffer
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
exports.decrypt = decrypt;
