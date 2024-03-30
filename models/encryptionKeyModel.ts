import mongoose from "mongoose";

interface IEncryptionKeyDocument extends Document {
  userId: mongoose.Types.ObjectId;
  mk: string;
  iv: string;
  salt: string;
  clientSalt: string;
}

const encryptionKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    mk: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    salt: {
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
