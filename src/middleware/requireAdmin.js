const prisma = require("../db/prisma");
const { verifyToken } = require("../utils/jwt");

async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const adminId = Number(decoded.sub);
    if (!adminId) {
      return res.status(401).json({ message: "Invalid token subject" });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin inactive" });
    }

    // attach for downstream use
    req.admin = { id: admin.id, email: admin.email, role: admin.role };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };