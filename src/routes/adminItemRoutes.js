const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/requireAdmin");
const { validate } = require("../middleware/validate");
const { upload } = require("../middleware/upload");

const {
  createItemJsonSchema,
  updateItemJsonSchema,
  setItemActiveSchema,
} = require("../validators/adminItemValidators");

const {
  createItem,
  updateItem,
  setItemActive,listItems
} = require("../controllers/adminItemController");

router.use(requireAdmin);

/**
 * We support BOTH:
 * 1) application/json (validated via Zod)
 * 2) multipart/form-data (validated in controller because fields arrive as strings)
 */

// POST /api/admin/items
router.post(
  "/",
  upload.single("image"), // optional file field named "image"
  (req, res, next) => {
    if (req.is("application/json")) return validate(createItemJsonSchema)(req, res, next);
    return next();
  },
  createItem
);
router.get("/", listItems);

// PATCH /api/admin/items/:id
router.patch(
  "/:id",
  upload.single("image"),
  (req, res, next) => {
    if (req.is("application/json")) return validate(updateItemJsonSchema)(req, res, next);
    return next();
  },
  updateItem
);

// PATCH /api/admin/items/:id/active
router.patch("/:id/active", validate(setItemActiveSchema), setItemActive);

module.exports = router;