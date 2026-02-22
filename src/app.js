require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminOrdersRoutes = require("./routes/adminOrdersRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");
const adminItemRoutes = require("./routes/adminItemRoutes");
const adminOptionsRoutes = require("./routes/adminOptionsRoutes");
const adminReportsRoutes = require("./routes/adminReportsRoutes");


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/items", adminItemRoutes);
app.use("/api/admin", adminOptionsRoutes);
app.use("/api/admin/reports", adminReportsRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;