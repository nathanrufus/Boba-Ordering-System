const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/requireAdmin");
const { validate } = require("../middleware/validate");

const {
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} = require("../validators/adminOrdersValidators");

const {
  listOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/adminOrdersController");

// All admin orders routes are protected
router.use(requireAdmin);

// GET /api/admin/orders
router.get("/", validate(listOrdersQuerySchema), listOrders);

// GET /api/admin/orders/:id
router.get("/:id", validate(orderIdParamSchema), getOrderById);

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;