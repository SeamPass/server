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
exports.deleteMultipleWifi = exports.deleteSingleWifi = exports.editWifiDetails = exports.getSingleWifi = exports.getWifi = exports.addWifi = void 0;
const catchAyncError_1 = require("../middleware/catchAyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const wifi_model_1 = __importDefault(require("../models/wifi.model"));
const pagination_1 = require("../utils/pagination");
exports.addWifi = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { wifiName, wifiPassword } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!wifiName || !wifiPassword) {
        return next(new ErrorHandler_1.default("Please provide all fields", 400));
    }
    yield wifi_model_1.default.create({
        user: userId,
        wifiName,
        wifiPassword,
    });
    res.status(201).json({
        success: true,
        message: "Wifi details added successfully.",
    });
}));
exports.getWifi = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerms = req.query.search;
    const searchFields = ["name"];
    // Retrieve all notes for the user with pagination
    const { results: wifi, pageInfo } = yield (0, pagination_1.paginate)(wifi_model_1.default, { user: userId }, searchTerms, searchFields, { page, limit });
    if (!wifi.length) {
        return next(new ErrorHandler_1.default("No notes found", 404));
    }
    const wifiDetails = wifi.map((wifiEntry) => ({
        id: wifiEntry._id,
        wifiPassword: wifiEntry.wifiPassword,
        wifiName: wifiEntry.wifiName,
        createdAt: wifiEntry.createdAt,
        updatedAt: wifiEntry.updatedAt,
    }));
    res.status(200).json(Object.assign(Object.assign({ success: true }, pageInfo), { data: wifiDetails }));
}));
exports.getSingleWifi = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { id } = req.params;
        const userId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c._id;
        const note = yield wifi_model_1.default.findOne({ _id: id, user: userId });
        if (!note) {
            return next(new ErrorHandler_1.default("Wifi details not found or access denied.", 404));
        }
        res.json({ success: true, data: note });
    }
    catch (error) {
        next(error);
    }
}));
exports.editWifiDetails = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { passwordId } = req.params;
    const updates = req.body;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
    const updatedWifi = yield wifi_model_1.default.findOneAndUpdate({ _id: passwordId, user: userId }, { $set: updates }, { new: true, runValidators: true });
    if (!updatedWifi) {
        return next(new ErrorHandler_1.default("Wifi not found or not owned by the user", 404));
    }
    res.status(200).json({
        success: true,
        message: "Wifi details updated successfully",
        data: updatedWifi,
    });
}));
exports.deleteSingleWifi = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
    const { wifiId } = req.params;
    if (!wifiId) {
        return next(new ErrorHandler_1.default("Wifi ID is required.", 400));
    }
    const deletionResult = yield wifi_model_1.default.deleteOne({
        _id: wifiId,
        user: userId,
    });
    if (deletionResult.deletedCount === 0) {
        return next(new ErrorHandler_1.default("Wifi not found or not owned by the user.", 404));
    }
    res.status(200).json({
        success: true,
        message: "Wifi has been successfully deleted.",
    });
}));
exports.deleteMultipleWifi = (0, catchAyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    const { wifiIds } = req.body;
    if (!Array.isArray(wifiIds) || wifiIds.length === 0) {
        return next(new ErrorHandler_1.default("An array of wifi IDs is required.", 400));
    }
    const deletionResult = yield wifi_model_1.default.deleteMany({
        _id: { $in: wifiIds },
        user: userId,
    });
    if (deletionResult.deletedCount === 0) {
        return next(new ErrorHandler_1.default("No wifis were deleted. They may not exist or not be owned by the user.", 404));
    }
    res.status(200).json({
        success: true,
        message: `${deletionResult.deletedCount} wifis have been successfully deleted.`,
    });
}));
