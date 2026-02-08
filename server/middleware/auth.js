const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = { authenticate };