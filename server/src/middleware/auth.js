const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Token nahi mila" });

  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid hai" });
  }
};
