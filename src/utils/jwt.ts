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
export const generateAccessToken = (id: string): string => {
  return jwt.sign({ _id: id }, process.env.ACCESS_TOKEN!, {
    expiresIn: "1d",
  });
};

// export const generateRefreshToken = (id: string): string => {
//   return jwt.sign({ _id: id }, process.env.REFRESH_TOKEN!, {
//     expiresIn: "1m",
//   });
// };

export const sendToken = (
  user: any,
  statusCode: number,
  res: Response
): void => {
  const accessToken = generateAccessToken(user.userInfo._id.toString());
  // const refreshToken = generateRefreshToken(user.userInfo._id.toString());

  // Send response with tokens
  res.status(statusCode).json({
    success: true,
    ...user,
    accessToken,
    // refreshToken,
    expiresIn: minutesToFutureTimestamp(
      Number(process.env.ACCESS_TOKEN_EXPIRE)
    ),
  });
};
