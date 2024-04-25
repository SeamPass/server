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

const sendMail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
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
  const templatePath = path.join(__dirname, "../mail", template);
  const website_url = process.env.WEBSITE_URL;
  // Render the email template with EJS
  const html: string = await ejs.renderFile(templatePath, {
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
  await transporter.sendMail(mailOptions);
};

export default sendMail;
