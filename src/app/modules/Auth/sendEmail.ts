import nodemailer from "nodemailer";
import config from "../../../config";

const sendEmail = async (email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.password,
    },
  });

  const info = await transporter.sendMail({
    from: '"Nova Gb"<noreply@novagb2.com>', // sender address
    to: email,
    subject: "Reset Password Link", // Subject line
    html,
  });

  console.log("Message sent: %s", info.messageId);
};

export default sendEmail;
