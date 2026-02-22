const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/requireAdmin");
const { validate } = require("../middleware/validate");
const { salesReportQuerySchema } = require("../validators/adminReportsValidators");
const { salesReport } = require("../controllers/adminReportsController");

// GET /api/admin/reports/sales
router.get("/sales", requireAdmin, validate(salesReportQuerySchema), salesReport);

module.exports = router;