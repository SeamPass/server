"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const encryptionKeySchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    mk: {
        type: String,
        required: true,
    },
    iv: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const EncryptionKeyModel = mongoose_1.default.model("EncryptionKey", encryptionKeySchema);
exports.default = EncryptionKeyModel;
