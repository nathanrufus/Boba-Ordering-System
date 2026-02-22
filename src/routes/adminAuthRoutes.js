const { changePasswordSchema } = require("../validators/adminPasswordValidators");
const { changePassword } = require("../controllers/adminAuthController");

// PATCH /api/admin/auth/password
router.patch("/password", requireAdmin, validate(changePasswordSchema), changePassword);