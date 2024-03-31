import rateLimit, { ValueDeterminingMiddleware } from "express-rate-limit";

interface ICreateRateLimiter {
  windowMs: number | undefined;
  max: number | ValueDeterminingMiddleware<number> | undefined;
  message: string | undefined;
}
export function createRateLimiter({
  windowMs,
  max,
  message,
}: ICreateRateLimiter) {
  return rateLimit({
    windowMs: windowMs, // window in milliseconds
    max: max, // limit each IP to max requests per windowMs
    message:
      message || "Too many requests from this IP, please try again later",
  });
}
