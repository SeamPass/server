"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: "hotmail",
        // port: process.env.STMP_PORT,
        // secure: process.env.STMP_SECURE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    console.log({
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
    });
    const { email, subject, template, data } = options;
    // get the path to the email template file
    const templatePath = path_1.default.join(__dirname, "../mail", template);
    const website_url = process.env.WEBSITE_URL;
    // Render the email template with EJS
    const html = yield ejs_1.default.renderFile(templatePath, {
        data,
        website_url,
    });
    console.log(html);
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };
    console.log(mailOptions);
    yield transporter.sendMail(mailOptions);
});
exports.default = sendEmail;
