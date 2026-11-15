const jwt = require("jsonwebtoken");
const { findUserById } = require("../utils/store");

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
