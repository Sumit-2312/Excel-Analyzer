import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

export default async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res
      .status(401)
      .json({ message: "Failed to authenticate token", error: err.message });
  }
}
