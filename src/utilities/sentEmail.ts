import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
} as SMTPTransport.Options);

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Blog App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(` Email sent to ${to} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(" Email sending failed:", error);
    throw error;
  }
};
