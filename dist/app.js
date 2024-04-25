"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./src/middleware/error");
const user_route_1 = __importDefault(require("./src/routes/user.route"));
const password_route_1 = __importDefault(require("./src/routes/password.route"));
const encryptionKey_route_1 = __importDefault(require("./src/routes/encryptionKey.route"));
const secret_route_1 = __importDefault(require("./src/routes/secret.route"));
const wifi_route_1 = __importDefault(require("./src/routes/wifi.route"));
//body parser
exports.app.use(express_1.default.json({
    limit: "50mb",
}));
//cookie parser
exports.app.use((0, cookie_parser_1.default)());
//cors => cross origin resource sharing
exports.app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://angry-minute-production.up.railway.app",
        "https://passsafe-fe-production.up.railway.app",
        "http://localhost:54346",
        " http://192.168.1.243:5173",
    ],
    credentials: true,
}));
//routes
exports.app.use("/api/v1", user_route_1.default, password_route_1.default, secret_route_1.default, wifi_route_1.default, encryptionKey_route_1.default);
//testing API
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Api is working perfectly",
    });
});
//unknown route incase of error
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 400;
    next(err);
});
exports.app.use(error_1.ErrorMiddleware);
