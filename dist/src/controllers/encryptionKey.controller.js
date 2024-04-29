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
exports.updateEncryptedSGEK = exports.retrieveEncryptedSGEK = exports.storeEncryptedSGEK = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const encryptionKeyModel_1 = __importDefault(require("../models/encryptionKeyModel"));
exports.storeEncryptedSGEK = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, iv, mk, salt } = req.body;
    try {
        if (!userId || !iv || !mk || !salt) {
            return next(new ErrorHandler_1.default("Please send all required fields", 400));
        }
        yield encryptionKeyModel_1.default.create({
            userId,
            mk,
            iv,
            salt,
        });
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default("Internal server error", 500));
    }
}));
exports.retrieveEncryptedSGEK = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id;
    try {
        const encryptionDetails = yield encryptionKeyModel_1.default.findOne({ userId });
        if (!encryptionDetails) {
            return next(new ErrorHandler_1.default("Encryption details not found", 404));
        }
        res.status(200).json({
            success: true,
            data: {
                mk: encryptionDetails.mk,
                iv: encryptionDetails.iv,
                salt: encryptionDetails.salt,
            },
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default("Internal server error", 500));
    }
}));
exports.updateEncryptedSGEK = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id;
    const { mk, iv, newSalt } = req.body;
    if (!mk || !iv || !newSalt) {
        return next(new ErrorHandler_1.default("Missing required fields: mk, iv, or newSalt", 400));
    }
    try {
        const encryptionDetails = yield encryptionKeyModel_1.default.findOne({
            userId: userId,
        });
        if (!encryptionDetails) {
            return next(new ErrorHandler_1.default("Encryption details not found", 404));
        }
        // Update the properties
        encryptionDetails.mk = mk;
        encryptionDetails.iv = iv;
        encryptionDetails.salt = newSalt;
        // Save the document
        const updatedEncryptionDetails = yield encryptionDetails.save();
        res.status(200).json({
            success: true,
            message: "Encryption details updated successfully",
            data: updatedEncryptionDetails,
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default("Internal server error", 500));
    }
}));
