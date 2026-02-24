const { prisma } = require("../db/prisma");

function toISODateStart(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toISODateEnd(dateStr) {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

// Normalize status from query: handles arrays, whitespace, casing
function normalizeStatus(raw) {
  if (raw == null) return null;

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;

  // decode just in case, then normalize
  const decoded = decodeURIComponent(value);
  return decoded.trim().toUpperCase().replace(/\s+/g, "_");
}

// GET /api/admin/orders
async function listOrders(req, res, next) {
  try {
    const { from, to } = req.query;

    const pageNum = Number(req.query.page ?? 1);
    const limitNum = Number(req.query.limit ?? 20);

    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20;

    const where = {};

const rawStatus = req.query.status;
const status = normalizeStatus(rawStatus);

const allowed = new Set(["NEW", "PENDING_VERIFICATION", "PREPARING", "DONE", "CANCELLED"]);

if (status) {
  if (!allowed.has(status)) {
    return res.status(400).json({
      message: "Invalid request data",
      receivedStatus: rawStatus,
      normalizedStatus: status,
      typeOfReceived: Array.isArray(rawStatus) ? "array" : typeof rawStatus,
    });
  }
  where.status = status;
}

    // date filters
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = toISODateStart(from);
      if (to) where.createdAt.lte = toISODateEnd(to);
    }

    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          customerName: true,
          customerPhone: true,
          fulfillmentType: true,
          status: true,
          subtotal: true,

          // ✅ Payment fields for verification list
          paymentMethod: true,
          paidAt: true,
          cbeReference: true,
          transactionId: true,
        },
      }),
    ]);

    res.json({
      page,
      limit,
      total,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        fulfillmentType: o.fulfillmentType,
        status: o.status,
        subtotal: o.subtotal.toFixed(2),

        paymentMethod: o.paymentMethod ?? null,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        cbeReference: o.cbeReference ?? null,
        transactionId: o.transactionId ?? null,
      })),
    });
  } catch (err) {
    console.error("ADMIN listOrders ERROR:", err);
    next(err);
  }
}

// GET /api/admin/orders/:id
async function getOrderById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: {
            options: { orderBy: { id: "asc" } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      subtotal: order.subtotal.toFixed(2),
      customerNote: order.customerNote,
      whatsappMessageText: order.whatsappMessageText,

      // ✅ Payment fields for verification
      paymentMethod: order.paymentMethod ?? null,
      paymentAmount: order.paymentAmount?.toFixed
        ? order.paymentAmount.toFixed(2)
        : order.paymentAmount
          ? String(order.paymentAmount)
          : null,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      transactionId: order.transactionId ?? null,
      cbeReference: order.cbeReference ?? null,
      paymentProofImageUrl: order.paymentProofImageUrl ?? null,

      items: order.items.map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId,
        itemNameSnapshot: it.itemNameSnapshot,
        unitPriceSnapshot: it.unitPriceSnapshot.toFixed(2),
        quantity: it.quantity,
        lineTotal: it.lineTotal.toFixed(2),
        options: it.options.map((op) => ({
          optionId: op.optionId,
          optionGroupNameSnapshot: op.optionGroupNameSnapshot,
          optionLabelSnapshot: op.optionLabelSnapshot,
          optionPriceDeltaSnapshot: op.optionPriceDeltaSnapshot.toFixed(2),
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/orders/:id/status
async function updateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { listOrders, getOrderById, updateOrderStatus };