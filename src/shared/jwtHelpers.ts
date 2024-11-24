import jwt, {
  JwtPayload,
  Secret,
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  try {
    const token = jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn,
    });
    return token;
  } catch (error) {
    return null;
  }
};

const verifyToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // Handle token expiration error
      return { error: "Token has expired" };
    } else if (error instanceof JsonWebTokenError) {
      // Handle other JWT errors
      return { error: "Invalid token" };
    } else {
      // Handle unexpected errors
      return { error: "Token verification failed" };
    }
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
