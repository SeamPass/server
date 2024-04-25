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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://angry-minute-production.up.railway.app",
      "https://passsafe-fe-production.up.railway.app",
      "http://localhost:54346",
      " http://192.168.1.243:5173",
    ],
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
