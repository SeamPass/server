import mongoose, { Document, Schema } from "mongoose";

interface ITwoFactor extends Document {
  userId: mongoose.Types.ObjectId;
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  createdAt: Date;
  lastUsed: Date;
  recoveryEmail: string;
  emailVerificationCode: string;
}

const twoFactorSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  secret: {
    type: String,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  backupCodes: [
    {
      type: String,
      required: false,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsed: {
    type: Date,
    required: false,
  },
  recoveryEmail: {
    type: String,
    required: false,
    validate: {
      validator: function (email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: "Please enter a valid email",
    },
  },
  emailVerificationCode: {
    type: String,
    required: false,
  },
});

const TwoFactorModel = mongoose.model<ITwoFactor>("TwoFactor", twoFactorSchema);

export default TwoFactorModel;
