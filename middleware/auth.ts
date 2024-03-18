import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CatchAsyncError } from "./catchAyncError";
import userModel from "../models/user.model";

// AUTHENTICATED USER
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    try {
      const decoded = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler("Access token is not valid", 400));
      }

      const user = await userModel.findById(decoded.id);

      if (!user) {
        return next(
          new ErrorHandler("User not found, please login again", 400)
        );
      }

      // Assign the user data to the request object
      req.user = user;

      next();
    } catch (error: any) {
      return next(
        new ErrorHandler("Error verifying access token: " + error.message, 500)
      );
    }
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
