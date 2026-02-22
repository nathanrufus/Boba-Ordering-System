const { prisma } = require("../db/prisma");
function toISODateStart(dateStr) {
  // dateStr: YYYY-MM-DD -> start of day UTC
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toISODateEnd(dateStr) {
  // dateStr: YYYY-MM-DD -> end of day UTC
  return new Date(`${dateStr}T23:59:59.999Z`);
}

// GET /api/admin/orders
async function listOrders(req, res, next) {
  try {
    const { status, from, to } = req.query;
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 20;

    const where = {};

    if (status) where.status = status;

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
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/orders/:id
async function getOrderById(req, res, next) {
  try {
    const id = req.params.id; // already transformed to number by validator

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: {
            options: {
              orderBy: { id: "asc" },
            },
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
    const id = req.params.id; // number from validator
    const { status } = req.body;

    // Ensure order exists
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