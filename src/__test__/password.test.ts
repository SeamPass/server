import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { getSinglePassword } from "../controllers/password.controller";
import PasswordModel from "../models/password.model";

jest.mock("../models/password.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

// Types for mocked req, res, and next
type MockRequest = Partial<Request> & {
  params: { id: string };
  user?: { _id: string };
};

type MockResponse = Partial<Response> & {
  json: jest.Mock;
};

type MockNextFunction = jest.Mock<NextFunction>;

describe("Password Controller Tests", () => {
  // Reset the mocks before each test
  beforeEach(() => {
    (PasswordModel.findOne as jest.Mock).mockClear();
  });

  it("should get password by id", async () => {
    // Set up the mock resolved value for findOne
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
    } as MockRequest;

    const res = {
      json: jest.fn(),
    } as MockResponse;

    const next: MockNextFunction = jest.fn();

    // Call the controller function with the mocked req, res, and next
    await getSinglePassword(
      req as Request,
      res as Response,
      next as NextFunction
    );

    // Assertions to ensure findOne was called correctly
    expect(PasswordModel.findOne).toHaveBeenCalledWith({
      _id: req.params.id,
      user: req?.user?._id,
    });

    // Assertions to ensure the response was sent
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.anything(),
    });
  });

  //Clear all mocks after all tests are done
  afterAll(() => {
    jest.restoreAllMocks();
  });
});
