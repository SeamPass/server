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
exports.deleteMultipleSecretNote = exports.deleteSingleSecretNote = exports.editSecretNote = exports.getSingleNote = exports.getSecretNote = exports.addSecretNote = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const secret_model_1 = __importDefault(require("../models/secret.model"));
const pagination_1 = require("../utils/pagination");
exports.addSecretNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, note } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!title || !note) {
        return next(new ErrorHandler_1.default("Please provide all fields", 400));
    }
    yield secret_model_1.default.create({
        user: userId,
        title,
        note,
    });
    res.status(201).json({
        success: true,
        message: "Secret note added successfully.",
    });
}));
exports.getSecretNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerms = req.query.search;
    const searchFields = ["title"];
    // Retrieve all notes for the user with pagination
    const { results: notes, pageInfo } = yield (0, pagination_1.paginate)(secret_model_1.default, { user: userId }, searchTerms, searchFields, { page, limit });
    if (!notes.length) {
        return res.status(200).json(Object.assign(Object.assign({ success: true }, pageInfo), { data: [] }));
    }
    const notesForClient = notes.map((secretEntry) => ({
        id: secretEntry._id,
        title: secretEntry.title,
        note: secretEntry.note,
        createdAt: secretEntry.createdAt,
        updatedAt: secretEntry.updatedAt,
    }));
    res.status(200).json(Object.assign(Object.assign({ success: true }, pageInfo), { data: notesForClient }));
}));
exports.getSingleNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { id } = req.params;
        const userId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c._id;
        const note = yield secret_model_1.default.findOne({ _id: id, user: userId });
        if (!note) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }
        res.json({ success: true, data: note });
    }
    catch (error) {
        next(error);
    }
}));
exports.editSecretNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { id } = req.params;
    const updates = req.body;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
    const updatedNote = yield secret_model_1.default.findOneAndUpdate({ _id: id, user: userId }, { $set: updates }, { new: true, runValidators: true });
    if (!updatedNote) {
        return next(new ErrorHandler_1.default("Secret note not found or not owned by the user", 404));
    }
    res.status(200).json({
        success: true,
        message: "Secret note updated successfully",
        data: updatedNote,
    });
}));
exports.deleteSingleSecretNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
    const { secretId } = req.params;
    try {
        if (!secretId) {
            return next(new ErrorHandler_1.default("Secret ID is required.", 400));
        }
        const deletionResult = yield secret_model_1.default.deleteOne({
            _id: secretId,
            user: userId,
        });
        if (deletionResult.deletedCount === 0) {
            return next(new ErrorHandler_1.default("Secret note not found or not owned by the user.", 404));
        }
        res.status(200).json({
            success: true,
            message: "Secret note has been successfully deleted.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.deleteMultipleSecretNote = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    const { secretIds } = req.body;
    if (!Array.isArray(secretIds) || secretIds.length === 0) {
        return next(new ErrorHandler_1.default("An array of secret note IDs is required.", 400));
    }
    const deletionResult = yield secret_model_1.default.deleteMany({
        _id: { $in: secretIds },
        user: userId,
    });
    if (deletionResult.deletedCount === 0) {
        return next(new ErrorHandler_1.default("No secrets note were deleted. They may not exist or not be owned by the user.", 404));
    }
    res.status(200).json({
        success: true,
        message: `${deletionResult.deletedCount} Secret notes have been successfully deleted.`,
    });
}));
