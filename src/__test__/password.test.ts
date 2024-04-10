// jest.mock("../models/password.model", () => {
//   const mockModel = {
//     findOne: jest.fn(),
//     create: jest.fn(),
//     // Other methods as needed
//   };
//   return {
//     __esModule: true,
//     default: mockModel,
//     // Export the mocked model directly
//     PasswordModel: mockModel,
//   };
// });

// import mongoose from "mongoose";
// import { Request, Response, NextFunction } from "express";
// import {
//   addPassword,
//   getSinglePassword,
// } from "../controllers/password.controller";
// import PasswordModel from "../models/password.model";

// type MockRequest = Partial<Request> & {
//   params: { id: string };
//   user: { _id: string };
//   body: any;
// };

// interface MockResponse extends Partial<Response> {
//   json: jest.Mock;
//   status: jest.Mock;
// }

// interface MockNextFunction extends NextFunction {}

// describe("PasswordController", () => {
//   let mockReq: MockRequest;
//   let mockRes: MockResponse;
//   let mockNext: MockNextFunction;

//   beforeEach(() => {
//     mockReq = {
//       params: { id: "password_id" },
//       user: { _id: "312y31sh373" },
//       body: {},
//     } as any;

//     mockRes = {
//       json: jest.fn(() => mockRes),
//       status: jest.fn(() => mockRes),
//     } as MockResponse;

//     mockNext = jest.fn() as MockNextFunction;

//     jest.clearAllMocks();
//   });

//   describe("getSinglePassword", () => {
//     it("should get a password by id", async () => {
//       const passwordData = {
//         _id: new mongoose.Types.ObjectId(),
//         user: mockReq.user?._id,
//         websiteName: "Test Website",
//         url: "http://test.com",
//         username: "testUser",
//         password: "testPass",
//         passwordStrength: "Strong",
//         compromised: false,
//       };

//       (PasswordModel.findOne as jest.Mock).mockResolvedValue(passwordData);

//       await getSinglePassword(
//         mockReq as unknown as Request,
//         mockRes as unknown as Response,
//         mockNext as NextFunction
//       );

//       expect(PasswordModel.findOne).toHaveBeenCalled();
//       expect(mockRes.json).toHaveBeenCalledWith(expect.anything());
//     });
//   });

//   describe("addPassword", () => {
//     it("should add a new password if not already existing", async () => {
//       const passwordDetails = {
//         websiteName: "New Website",
//         url: "https://new-website.com",
//         username: { encUsername: "username", iv: "usernameIv" },
//         password: { encPassword: "password", iv: "passwordIv" },
//       };

//       mockReq.body = { ...passwordDetails, websiteUrl: passwordDetails.url };

//       // Mock implementation of findOne to simulate no existing password
//       (PasswordModel.findOne as jest.Mock).mockResolvedValue(null);

//       // Mock implementation of create
//       (PasswordModel.create as jest.Mock).mockResolvedValue({
//         user: mockReq.user?._id,
//         ...passwordDetails,
//         passwordStrength: "Normal",
//         compromised: false,
//       });

//       // Act
//       await addPassword(
//         mockReq as unknown as Request,
//         mockRes as unknown as Response,
//         mockNext as NextFunction
//       );

//       // Assert
//       expect(PasswordModel.findOne).toHaveBeenCalledWith({
//         user: mockReq.user?._id,
//         websiteName: passwordDetails.websiteName,
//         url: passwordDetails.url,
//       });

//       expect(PasswordModel.create).toHaveBeenCalledWith(expect.anything());
//       // expect(mockRes.status).toHaveBeenCalledWith(201);
//       // expect(mockRes.json).toHaveBeenCalledWith({
//       //   success: true,
//       //   message: "Password information added successfully.",
//       // });
//     });
//   });
// });
