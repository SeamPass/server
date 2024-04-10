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
jest.mock("../models/password.model", () => {
    const mockModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        // Other methods as needed
    };
    return {
        __esModule: true,
        default: mockModel,
        // Export the mocked model directly
        PasswordModel: mockModel,
    };
});
const mongoose_1 = __importDefault(require("mongoose"));
const password_controller_1 = require("../controllers/password.controller");
const password_model_1 = __importDefault(require("../models/password.model"));
describe("PasswordController", () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            params: { id: "password_id" },
            user: { _id: "312y31sh373" },
            body: {},
        };
        mockRes = {
            json: jest.fn(() => mockRes),
            status: jest.fn(() => mockRes),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });
    describe("getSinglePassword", () => {
        it("should get a password by id", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const passwordData = {
                _id: new mongoose_1.default.Types.ObjectId(),
                user: (_a = mockReq.user) === null || _a === void 0 ? void 0 : _a._id,
                websiteName: "Test Website",
                url: "http://test.com",
                username: "testUser",
                password: "testPass",
                passwordStrength: "Strong",
                compromised: false,
            };
            password_model_1.default.findOne.mockResolvedValue(passwordData);
            yield (0, password_controller_1.getSinglePassword)(mockReq, mockRes, mockNext);
            expect(password_model_1.default.findOne).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.anything());
        }));
    });
    describe("addPassword", () => {
        it("should add a new password if not already existing", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const passwordDetails = {
                websiteName: "New Website",
                url: "https://new-website.com",
                username: { encUsername: "username", iv: "usernameIv" },
                password: { encPassword: "password", iv: "passwordIv" },
            };
            mockReq.body = Object.assign(Object.assign({}, passwordDetails), { websiteUrl: passwordDetails.url });
            // Mock implementation of findOne to simulate no existing password
            password_model_1.default.findOne.mockResolvedValue(null);
            // Mock implementation of create
            password_model_1.default.create.mockResolvedValue(Object.assign(Object.assign({ user: (_a = mockReq.user) === null || _a === void 0 ? void 0 : _a._id }, passwordDetails), { passwordStrength: "Normal", compromised: false }));
            // Act
            yield (0, password_controller_1.addPassword)(mockReq, mockRes, mockNext);
            // Assert
            expect(password_model_1.default.findOne).toHaveBeenCalledWith({
                user: (_b = mockReq.user) === null || _b === void 0 ? void 0 : _b._id,
                websiteName: passwordDetails.websiteName,
                url: passwordDetails.url,
            });
            expect(password_model_1.default.create).toHaveBeenCalledWith(expect.anything());
            // expect(mockRes.status).toHaveBeenCalledWith(201);
            // expect(mockRes.json).toHaveBeenCalledWith({
            //   success: true,
            //   message: "Password information added successfully.",
            // });
        }));
    });
});
