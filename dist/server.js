"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = __importDefault(require("./src/utils/db"));
require("dotenv").config();
//create server
const port = process.env.PORT;
app_1.app.listen(port, () => {
    console.log(`Server is connected with port ${port}`);
    (0, db_1.default)();
});
