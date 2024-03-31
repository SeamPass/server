// Mock the entire module with jest.mock
jest.mock("../models/password.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import PasswordModel from "../models/password.model";
import { getSinglePassword } from "../controllers/password.controller";

// Mock the entire module with jest.mock
jest.mock("../models/password.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

//types for mocked requests and responses
type MockRequest = Partial<Request> & {
  params: { id: string };
  user?: { _id: string };
};
type MockResponse = Partial<Response> & {
  json: jest.Mock;
};
type MockNextFunction = jest.Mock<NextFunction>;

//mocked model to jest.Mocked type
const mockedPasswordModel = PasswordModel as jest.Mocked<typeof PasswordModel>;

describe("Password Controller Tests", () => {
  // mock request, response, and next function
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: MockNextFunction;

  // Reset the mocks before each test
  beforeEach(() => {
    mockReq = {
      params: { id: "password_id" },
      user: { _id: "user_id" },
    } as MockRequest;
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as MockResponse;
    mockNext = jest.fn() as MockNextFunction;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should get a password by id", async () => {
    // Set up the mock resolved value for findOne
    mockedPasswordModel.findOne.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      websiteName: "Test Website",
      url: "http://test.com",
      username: { encUsername: "encrypted_username", iv: "iv_value" },
      password: { encPassword: "encrypted_password", iv: "iv_value" },
      passwordStrength: "Strong",
      compromised: false,
    });

    // Call the controller function with the mocked request and response
    await getSinglePassword(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction
    );

    // Assertions to ensure the methods were called correctly
    expect(mockedPasswordModel.findOne).toHaveBeenCalledWith({
      _id: mockReq.params.id,
      user: mockReq.user?._id,
    });
    expect(mockRes.json).toHaveBeenCalledWith(expect.anything());
  });

  describe("add password", () => {});
});

// Clear all mocks after all tests are done
afterAll(() => {
  jest.restoreAllMocks();
});
