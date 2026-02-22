// src/routes/adminAuthRoutes.js
const express = require("express");
const router = express.Router();

const { validate } = require("../middleware/validate");
const { requireAdmin } = require("../middleware/requireAdmin");

const { adminLoginSchema } = require("../validators/adminAuthValidators");
const { changePasswordSchema } = require("../validators/adminPasswordValidators");

const { login, me, changePassword } = require("../controllers/adminAuthController");

// POST /api/admin/auth/login
router.post("/login", validate(adminLoginSchema), login);

// GET /api/admin/auth/me
router.get("/me", requireAdmin, me);

// PATCH /api/admin/auth/password
router.patch("/password", requireAdmin, validate(changePasswordSchema), changePassword);

module.exports = router;