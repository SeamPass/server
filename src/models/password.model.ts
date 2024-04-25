import mongoose, { Schema, Document } from "mongoose";

interface IPasswordDocument extends Document {
  user: mongoose.Types.ObjectId;
  websiteName: string;
  url: string;
  username: { encUsername: string; iv: string };
  password: { encPassword: string; iv: string };
  passwordStrength: string;
  compromised: boolean;
}

const PasswordSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: false,
      trim: true,
    },
    username: {
      encUsername: { type: String, required: true },
      iv: { type: String, required: true },
    },
    password: {
      encPassword: { type: String, required: true },
      iv: { type: String, required: true },
    },
    passwordStrength: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PasswordModel = mongoose.model<IPasswordDocument>(
  "Password",
  PasswordSchema
);

export default PasswordModel;
