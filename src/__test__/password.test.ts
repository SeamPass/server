import { getSinglePassword } from "../controllers/password.controller";
import { Request, Response, NextFunction } from "express";
import PasswordModel from "../models/password.model";

// Mock the PasswordModel.findOne method
jest.mock("../models/password.model", () => ({
  findOne: jest.fn(),
}));

// Mock implementation for res.json
const res = {
  json: jest.fn((obj) => obj),
} as Partial<Response>;

// Mock implementation for next function
const next = jest.fn();

describe("get passwords", () => {
  it("should get password by id", async () => {
    const req = {
      params: { id: "passwordId" },
      user: { _id: "userId" },
    } as any;

    // Mock implementation returning a resolved promise
    (PasswordModel.findOne as jest.Mock).mockResolvedValue({
      some: "password",
    });

    await getSinglePassword(
      req as Request,
      res as Response,
      next as NextFunction
    );

    expect(PasswordModel.findOne).toHaveBeenCalledWith({
      _id: "passwordId",
      user: "userId",
    });
    expect(res.json).toHaveBeenCalled();
  });
});
