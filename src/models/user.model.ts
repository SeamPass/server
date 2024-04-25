require("dotenv").config();
import mongoose, { Model, Schema } from "mongoose";
import { generateSalt, hashPassword } from "../utils/passwordHash";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Iuser extends Document {
  _id: string;
  nickname: string;
  email: string;
  password: string;
  isVerified: boolean;
  avatar: string;
  role: string;
  clientSalt: string;
  is2StepEnabled: boolean;
  verificationToken: string | undefined;
  tokenExpiration: Date | undefined;
  resetPasswordToken: string | undefined;
  resetPasswordExpire: Date | undefined;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
  encryptedEncryptionKey: string;
  sek: string;
}

const userSchema: Schema<Iuser> = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, "Please enter your nickname"],
      minLength: [5, "Nickname/Username must be at least 5 letters long"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
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
  },
  { timestamps: true }
);

//compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  const hashedEnteredPassword = await hashPassword(enteredPassword, this.salt);
  return this.password === hashedEnteredPassword;
};

const userModel: Model<Iuser> = mongoose.model("User", userSchema);

export default userModel;
