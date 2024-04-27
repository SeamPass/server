import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CatchAsyncError } from "./catchAyncError";

// AUTHENTICATED USER
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];

    if (!accessToken) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN as string,
      (err, decoded) => {
        if (err) {
          return next(new ErrorHandler(err.message, 401));
        }

        req.user = decoded as JwtPayload;

        next();
      }
    );
  }
);

// VALIDATE USER ROLE
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
