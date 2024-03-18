import { Response } from "express";
import jwt from "jsonwebtoken";
import { minutesToFutureTimestamp } from "./minutesToFutureTimestamp";

interface ProcessEnv {
  [key: string]: string | undefined;
}

declare var process: {
  env: ProcessEnv;
};

// Generate JWT Access and Refresh Tokens
export const generateAccessToken = (userId: any): string => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN!, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: any): string => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN!, {
    expiresIn: "7d",
  });
};

export const sendToken = (
  user: any,
  statusCode: number,
  res: Response
  // sessionIdentifier: string
): void => {
  console.log(user);
  const accessToken = generateAccessToken(user.userInfo._id.toString());
  const refreshToken = generateRefreshToken(user.userInfo._id.toString());

  // Options for cookies
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const, // Using 'as const' for literal types
    secure: process.env.NODE_ENV === "production",
  };

  // Set cookies for tokens
  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: Number(process.env.ACCESS_TOKEN_EXPIRE),
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: minutesToFutureTimestamp(Number(process.env.REFRESH_TOKEN_EXPIRE)),
  });

  // Send response with tokens
  res.status(statusCode).json({
    success: true,
    ...user,
    accessToken,
    expiresIn: minutesToFutureTimestamp(
      Number(process.env.ACCESS_TOKEN_EXPIRE)
    ),
  });
};
