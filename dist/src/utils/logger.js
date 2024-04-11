"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
require("winston-mongodb");
const logger = (0, winston_1.createLogger)({
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [
        new winston_1.transports.File({ filename: "error.log", level: "error" }),
        new winston_1.transports.File({ filename: "combined.log" }),
    ],
});
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston_1.transports.Console({
        format: winston_1.format.simple(),
    }));
}
else {
    logger.add(new winston_1.transports.MongoDB({
        level: "info",
        // MongoDB connection string
        db: process.env.DB_URI || "",
        options: { useUnifiedTopology: true },
        // Collection to store log entries
        collection: "log",
        format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    }));
}
exports.default = logger;
