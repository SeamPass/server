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
exports.deleteMultiplePasswords = exports.deleteSinglePassword = exports.editPassword = exports.getSinglePassword = exports.getPassword = exports.addPassword = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const password_model_1 = __importDefault(require("../models/password.model"));
const pagination_1 = require("../utils/pagination");
exports.addPassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { websiteName, websiteUrl, username, password, usernameIv, passwordIv, passwordStrength, } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Check if the password already exists in the vault
        const existingPassword = yield password_model_1.default.findOne({
            user: userId,
            websiteName,
            url: websiteUrl,
        });
        if (existingPassword) {
            return res.status(400).json({
                success: false,
                message: "Password already exists in the vault.",
            });
        }
        const details = yield password_model_1.default.create({
            user: userId,
            websiteName,
            url: websiteUrl,
            username: { encUsername: username, iv: usernameIv },
            password: { encPassword: password, iv: passwordIv },
            passwordStrength,
        });
        yield details.save();
        // Set response status to 201
        res.status(201).json({
            success: true,
            message: "Password information added successfully.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.getPassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerms = req.query.search;
    const searchFields = ["websiteName"];
    // Retrieve all passwords for the user with pagination
    const { results: passwords, pageInfo } = yield (0, pagination_1.paginate)(password_model_1.default, { user: userId }, searchTerms, searchFields, { page, limit });
    if (!passwords.length) {
        return next(new ErrorHandler_1.default("No passwords found", 404));
    }
    const passwordsForClient = passwords.map((passwordEntry) => ({
        id: passwordEntry._id,
        websiteName: passwordEntry.websiteName,
        url: passwordEntry.url,
        username: passwordEntry.username,
        password: passwordEntry.password,
        passwordStrength: passwordEntry.passwordStrength,
        websiteNameIv: passwordEntry.websiteNameIv,
        urlIv: passwordEntry.urlIv,
        usernameIv: passwordEntry.usernameIv,
        passwordIv: passwordEntry.passwordIv,
    }));
    res.status(201).json(Object.assign(Object.assign({ success: true }, pageInfo), { data: passwordsForClient }));
}));
exports.getSinglePassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { id } = req.params;
        const userId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c._id;
        const password = yield password_model_1.default.findOne({ _id: id, user: userId });
        if (!password) {
            return next(new ErrorHandler_1.default("Password not found or access denied.", 404));
        }
        res.json({ success: true, data: password });
    }
    catch (error) {
        next(error);
    }
}));
exports.editPassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { passwordId } = req.params;
    const updates = req.body;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
    const updatedPassword = yield password_model_1.default.findOneAndUpdate({ _id: passwordId, user: userId }, { $set: updates }, { new: true, runValidators: true });
    if (!updatedPassword) {
        return next(new ErrorHandler_1.default("Password not found or not owned by the user", 404));
    }
    res.status(200).json({
        success: true,
        message: "Password updated successfully",
        data: updatedPassword,
    });
}));
exports.deleteSinglePassword = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req === null || req === void 0 ? void 0 : req.user) === null || _e === void 0 ? void 0 : _e._id;
    const { passwordId } = req.params;
    if (!passwordId) {
        return next(new ErrorHandler_1.default("Password ID is required.", 400));
    }
    const deletionResult = yield password_model_1.default.deleteOne({
        _id: passwordId,
        user: userId,
    });
    if (deletionResult.deletedCount === 0) {
        return next(new ErrorHandler_1.default("Password not found or not owned by the user.", 404));
    }
    res.status(200).json({
        success: true,
        message: "Password has been successfully deleted.",
    });
}));
exports.deleteMultiplePasswords = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    const { passwordIds } = req.body;
    if (!Array.isArray(passwordIds) || passwordIds.length === 0) {
        return next(new ErrorHandler_1.default("An array of password IDs is required.", 400));
    }
    const deletionResult = yield password_model_1.default.deleteMany({
        _id: { $in: passwordIds },
        user: userId,
    });
    if (deletionResult.deletedCount === 0) {
        return next(new ErrorHandler_1.default("No passwords were deleted. They may not exist or not be owned by the user.", 404));
    }
    res.status(200).json({
        success: true,
        message: `${deletionResult.deletedCount} passwords have been successfully deleted.`,
    });
}));
