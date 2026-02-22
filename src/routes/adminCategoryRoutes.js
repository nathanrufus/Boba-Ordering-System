const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/requireAdmin");
const { validate } = require("../middleware/validate");

const {
  createCategorySchema,
  updateCategorySchema,
  setCategoryActiveSchema,
} = require("../validators/adminCategoryValidators");

const {
  createCategory,
  updateCategory,
  setCategoryActive,
} = require("../controllers/adminCategoryController");

// all protected
router.use(requireAdmin);

// POST /api/admin/categories
router.post("/", validate(createCategorySchema), createCategory);

// PATCH /api/admin/categories/:id
router.patch("/:id", validate(updateCategorySchema), updateCategory);

// PATCH /api/admin/categories/:id/active
router.patch("/:id/active", validate(setCategoryActiveSchema), setCategoryActive);

module.exports = router;