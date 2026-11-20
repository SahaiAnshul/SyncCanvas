import jwt from "jsonwebtoken";

const getSecret = () => {
  return process.env.JWT_SECRET || "synccanvas_default_jwt_secret_key_anshul_2026";
};

// Access tokens are deliberately short-lived. Persistent sessions use an opaque,
// rotating refresh token stored in an HTTP-only cookie.
export const createToken = (userId) => jwt.sign({ id: userId }, getSecret(), { expiresIn: "15m" });
export const verifyToken = (token) => jwt.verify(token, getSecret());
