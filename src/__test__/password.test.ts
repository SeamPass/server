import mongoose from "mongoose";
import PasswordModel from "../models/password.model";
import { getSinglePassword } from "../controllers/password.controller";
import { Request, Response, NextFunction } from "express";

// Jest mock for mongoose model
jest.mock("../models/password.model");

describe("get passwords", () => {
  it("should get password by id", async () => {
    // Mock the implementation of findOne to return a resolved promise
    (PasswordModel.findOne as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      websiteName: "Test Website",
      url: "http://test.com",
      username: { encUsername: "encrypted_username", iv: "iv_value" },
      password: { encPassword: "encrypted_password", iv: "iv_value" },
      passwordStrength: "Strong",
      compromised: false,
    });

    // Create mock request and response objects
    const req = {
      params: { id: "some_id" },
      user: { _id: "user_id" },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    // Call the controller function
    await getSinglePassword(req, res, next);

    // Assertions to check if response is correct
    expect(PasswordModel.findOne).toHaveBeenCalledWith({
      _id: req.params.id,
      user: req?.user?._id,
    });
    expect(res.json).toHaveBeenCalled();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
