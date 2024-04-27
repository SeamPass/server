require("dotenv").config();
import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

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
  ps: string;
  hintSalt: string;
  encryptedHint: string;
  hintIv: string;
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
    hintSalt: {
      type: String,
    },
    hintIv: {
      type: String,
    },
    encryptedHint: {
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
  },
  { timestamps: true }
);

//encrypt password before saving to DB
userSchema.pre<any>("save", async function (next: any) {
  if (!this.isModified("password")) {
    return next;
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(this.password, salt);
  this.password = hashPassword;
  next();
});

//compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<Iuser> = mongoose.model("User", userSchema);

export default userModel;
