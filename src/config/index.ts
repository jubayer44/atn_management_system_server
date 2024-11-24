import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  PORT: process.env.PORT,
  jwt: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    RESET_PASS_TOKEN_SECRET: process.env.RESET_PASS_TOKEN,
    RESET_PASS_TOKEN_EXPIRES_IN: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  password_salt: process.env.PASSWORD_SALT,
  reset_password_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    password: process.env.APP_PASS,
  },
};
