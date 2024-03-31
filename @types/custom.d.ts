import { Request } from "express";
import { Iuser } from "../src/models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: Iuser;
    }
  }
}
