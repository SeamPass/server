require("dotenv").config();
import mongoose from "mongoose";

const dbUri: string = process.env.DB_URI || "";
const connectDB = async () => {
  try {
    await mongoose.connect(dbUri).then((data) => {
      console.log("Database connected with" + data.connection.host);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
