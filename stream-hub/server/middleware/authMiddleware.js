const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in HTTP-Only Cookies
  if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;

      // Verify token with our Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in DB and attach to request (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Move to the actual controller
    } catch (error) {
      console.error("Auth Error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };