
module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "❌ Unauthorized. Please log in first.",
        });
      }

      const userRole = req.user.role;

      if (!userRole) {
        return res.status(400).json({
          message: "⚠️ User role not found. Contact support.",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `🚫 Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${userRole}`,
        });
      }

      next();
    } catch (err) {
      console.error("❌ requireRole Middleware Error:", err.message);
      res.status(500).json({
        message: "❌ Server error in role verification",
        error: err.message,
      });
    }
  };
};
