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
exports.isPasswordCompromised = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
// Utility function to check password against HIBP
function isPasswordCompromised(password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Hash the password using SHA-1
            const sha1Password = crypto_1.default
                .createHash("sha1")
                .update(password)
                .digest("hex")
                .toUpperCase();
            const prefix = sha1Password.substring(0, 5);
            const suffix = sha1Password.substring(5);
            // Call the HIBP API with the first 5 characters of the hash
            const response = yield axios_1.default.get(`https://api.pwnedpasswords.com/range/${prefix}`);
            const hashes = response.data.split("\r\n");
            // Check if the suffix of the password's hash is in the returned list
            return hashes.some((line) => {
                const [hashSuffix] = line.split(":");
                return hashSuffix === suffix;
            });
        }
        catch (error) {
            console.error("Error checking password against HIBP:", error);
            throw new Error("Unable to verify password security at this time.");
        }
    });
}
exports.isPasswordCompromised = isPasswordCompromised;
