require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import passwordRouter from "./routes/password.route";
import encryptionKeyRouter from "./routes/encryptionKey.route";
import secretRouter from "./routes/secret.route";
import wifiRouter from "./routes/wifi.route";

//body parser
app.use(
  express.json({
    limit: "50mb",
  })
);

//cookie parser
app.use(cookieParser());

//cors => cross origin resource sharing
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

//routes
app.use(
  "/api/v1",
  userRouter,
  passwordRouter,
  secretRouter,
  wifiRouter,
  encryptionKeyRouter
);

//testing API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "Api is working perfectly",
  });
});

//unknown route incase of error
app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 400;
  next(err);
});

app.use(ErrorMiddleware);
