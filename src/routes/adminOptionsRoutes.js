const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/requireAdmin");
const { validate } = require("../middleware/validate");

const {
  idParamSchema,
  createOptionGroupSchema,
  updateOptionGroupSchema,
  createOptionSchema,
  updateOptionSchema,
  setItemOptionGroupsSchema,
} = require("../validators/adminOptionsValidators");

const {
  createOptionGroup,
  updateOptionGroup,
  createOption,
  updateOption,
  setItemOptionGroups,
} = require("../controllers/adminOptionsController");

// Protect all
router.use(requireAdmin);

// Option Groups
router.post("/option-groups", validate(createOptionGroupSchema), createOptionGroup);
router.patch("/option-groups/:id", validate(updateOptionGroupSchema), updateOptionGroup);

// Options
router.post("/options", validate(createOptionSchema), createOption);
router.patch("/options/:id", validate(updateOptionSchema), updateOption);

// Apply option groups to item (replace)
router.post("/items/:id/option-groups", validate(setItemOptionGroupsSchema), setItemOptionGroups);

module.exports = router;