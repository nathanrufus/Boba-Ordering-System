const { prisma } = require("../db/prisma");
const bcrypt = require("bcryptjs");
const { signAdminToken } = require("../utils/jwt");

// const bcrypt = require("bcryptjs");
// const { prisma } = require("../db/prisma");
// PATCH /api/admin/auth/password
async function changePassword(req, res, next) {
  try {
    const adminId = req.admin.id; // set by requireAdmin middleware
    const { currentPassword, newPassword } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin inactive" });
    }

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    // 401 invalid credentials (do NOT reveal which part failed)
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 403 admin inactive
    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin inactive" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // update lastLoginAt (non-blocking is ok, but keeping it awaited is simplest)
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAdminToken(admin);

    // EXACT contract
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/auth/me
async function me(req, res, next) {
  try {
    // requireAdmin middleware sets req.admin
    res.json(req.admin);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, changePassword };