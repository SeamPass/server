import mongoose, { Schema, Document } from "mongoose";

// Interface to define the model properties
interface IWifiDocument extends Document {
  user: mongoose.Types.ObjectId;
  wifiName: string;
  wifiPassword: string;
}

// Schema definition
const WifiSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wifiName: {
      type: String,
      required: true,
      trim: true,
    },
    wifiPassword: {
      encWifiPassword: { type: String, required: true, trim: true },
      iv: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Model creation
const WifiModel = mongoose.model<IWifiDocument>("Wifi", WifiSchema);

export default WifiModel;
