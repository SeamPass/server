import mongoose from "mongoose";

interface IEncryptionKeyDocument extends Document {
  userId: mongoose.Types.ObjectId;
  encryptedSGEK: string;
  iv: string;
}

const encryptionKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    encryptedSGEK: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const EncryptionKeyModel = mongoose.model<IEncryptionKeyDocument>(
  "EncryptionKey",
  encryptionKeySchema
);

export default EncryptionKeyModel;
