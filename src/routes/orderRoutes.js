const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { createOrderSchema, orderNumberParamSchema } = require("../validators/orderValidators");
const { createOrder, getOrderByOrderNumber } = require("../controllers/orderController");

// POST /api/orders
router.post("/", validate(createOrderSchema), createOrder);

// GET /api/orders/:orderNumber  (optional but recommended)
router.get("/:orderNumber", validate(orderNumberParamSchema), getOrderByOrderNumber);

module.exports = router;