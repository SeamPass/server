import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import {
  addPassword,
  getSinglePassword,
} from "../controllers/password.controller";
import PasswordModel from "../models/password.model";

// Assuming jest is already in the Jest global scope
// If not, import it as needed

// Mock the entire PasswordModel for all tests in this file
jest.mock("../models/password.model");

// Define types for request and response. These should reflect the actual types used in your controllers.
type MockRequest = Partial<Request> & {
  params: { id: string };
  user: { _id: string };
  body: any;
};

interface MockResponse extends Partial<Response> {
  json: jest.Mock;
  status: jest.Mock;
}

interface MockNextFunction extends NextFunction {}

// Describe block for the PasswordController
describe("PasswordController", () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: MockNextFunction;

  beforeEach(() => {
    // Mock reset for each test
    mockReq = {
      params: { id: "password_id" },
      user: { _id: "312y31sh373" },
      body: {},
    } as any;

    mockRes = {
      json: jest.fn(() => mockRes), // Return mockRes to allow chaining of calls
      status: jest.fn(() => mockRes), // Return mockRes to allow chaining of calls
    } as MockResponse;

    mockNext = jest.fn() as MockNextFunction;

    // Clear mock implementations
    jest.clearAllMocks();
  });

  describe("getSinglePassword", () => {
    it("should get a password by id", async () => {
      const passwordData = {
        _id: new mongoose.Types.ObjectId(),
        user: mockReq.user?._id,
        websiteName: "Test Website",
        url: "http://test.com",
        username: "testUser",
        password: "testPass",
        passwordStrength: "Strong",
        compromised: false,
      };

      // Mock implementation of findOne
      (PasswordModel.findOne as jest.Mock).mockResolvedValue(passwordData);

      // Act
      await getSinglePassword(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      // Assert
      expect(PasswordModel.findOne).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe("addPassword", () => {
    it("should add a new password if not already existing", async () => {
      const passwordDetails = {
        websiteName: "New Website",
        url: "https://new-website.com",
        username: { encUsername: "username", iv: "usernameIv" },
        password: { encPassword: "password", iv: "passwordIv" },
      };

      mockReq.body = passwordDetails;

      // Mock implementation of findOne to simulate no existing password
      (PasswordModel.findOne as jest.Mock).mockResolvedValue(null);

      // Mock implementation of create
      (PasswordModel.create as jest.Mock).mockResolvedValue({
        user: mockReq.user?._id,
        ...passwordDetails,
        passwordStrength: "Normal",
        compromised: false,
      });

      // Act
      await addPassword(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      // Assert
      expect(PasswordModel.findOne).toHaveBeenCalledWith({
        user: mockReq.user?._id,
        websiteName: passwordDetails.websiteName,
        url: passwordDetails?.url,
      });

      expect(PasswordModel.create).toHaveBeenCalledWith(expect.anything());
      // expect(mockRes.status).toHaveBeenCalledWith(201);
      // expect(mockRes.json).toHaveBeenCalledWith(expect.anything());
    });
  });

  // Other tests...

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
