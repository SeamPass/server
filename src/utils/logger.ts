import { createLogger, transports, format } from "winston";
import "winston-mongodb";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
} else {
  logger.add(
    new transports.MongoDB({
      level: "info",
      // MongoDB connection string
      db: process.env.DB_URI || "",
      options: { useUnifiedTopology: true },
      // Collection to store log entries
      collection: "log",
      format: format.combine(format.timestamp(), format.json()),
    })
  );
}

export default logger;
