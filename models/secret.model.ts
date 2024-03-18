import mongoose, { Schema, Document } from "mongoose";

// Interface to define the model properties
interface ISecretDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  note: { encryptedNote: string; iv: string };
}

// Schema definition
const SecretSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      encNote: { type: String, required: true },
      iv: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Model creation
const SecretModel = mongoose.model<ISecretDocument>("Secret", SecretSchema);

export default SecretModel;
