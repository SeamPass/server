import mongoose, { Document, Schema } from "mongoose";

interface IEmailVerification extends Document {
  userId: mongoose.Types.ObjectId;
  emailVerificationCode: string | undefined;
  expirationTime: Date;
  isForLoginEnabled: boolean;
}

const emailVerificationSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emailVerificationCode: {
    type: String,
    required: false,
  },
  expirationTime: {
    type: Date,
    required: true,
  },
  isForLoginEnabled: {
    type: Boolean,
    default: false,
  },
});

const EmailVerificationModel = mongoose.model<IEmailVerification>(
  "EmailVerification",
  emailVerificationSchema
);

export default EmailVerificationModel;
