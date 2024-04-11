require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./src/middleware/error";
import userRouter from "./src/routes/user.route";
import passwordRouter from "./src/routes/password.route";
import encryptionKeyRouter from "./src/routes/encryptionKey.route";
import secretRouter from "./src/routes/secret.route";
import wifiRouter from "./src/routes/wifi.route";

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
    origin: ["https://passsafe-fe-production.up.railway.app"],
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
