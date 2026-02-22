const jwt = require("jsonwebtoken");

function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");

  const payload = {
    sub: String(admin.id),
    role: admin.role,
    email: admin.email,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret);
}

module.exports = { signAdminToken, verifyToken };