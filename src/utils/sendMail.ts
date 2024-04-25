require("dotenv").config();
import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string | undefined;
  subject: string;
  template: string;
  data?: { [key: string]: any };
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;

  // get the path to the email template file
  const templatePath = path.join(__dirname, "../mail", template);
  const website_url = process.env.WEBSITE_URL;
  // Render the email template with EJS
  const html: string = await ejs.renderFile(templatePath, {
    data,
    website_url,
  });

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
