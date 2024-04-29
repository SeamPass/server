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
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new mongoose_1.default.Schema({
    nickname: {
        type: String,
        required: [true, "Please enter your nickname"],
        minLength: [5, "Nickname/Username must be at least 5 letters long"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        select: false,
    },
    clientSalt: {
        type: String,
    },
    sek: {
        type: String,
    },
    avatar: {
        type: String,
    },
    ps: { type: String },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    is2StepEnabled: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
    tokenExpiration: {
        type: Date,
    },
}, { timestamps: true });
//encrypt password before saving to DB
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password")) {
            return next;
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashPassword = yield bcrypt_1.default.hash(this.password, salt);
        this.password = hashPassword;
        next();
    });
});
//compare password
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(enteredPassword, this.password);
    });
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
