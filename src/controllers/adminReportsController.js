const { prisma } = require("../db/prisma");const { Prisma } = require("@prisma/client");

function toStartUTC(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}
function toEndUTC(dateStr) {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

async function salesReport(req, res, next) {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = toStartUTC(from);
      if (to) where.createdAt.lte = toEndUTC(to);
    }

    // totalOrders + revenue
    const [totalOrders, agg] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { subtotal: true },
      }),
    ]);

    const revenueDecimal = agg._sum.subtotal ?? new Prisma.Decimal(0);
    const revenue = revenueDecimal.toFixed(2);

    // Top items (optional but included)
    // We sum OrderItem.lineTotal grouped by itemNameSnapshot, within the same date filter on the parent Order
    const top = await prisma.orderItem.groupBy({
      by: ["itemNameSnapshot"],
      where: {
        order: where, // filters by Order.createdAt if provided
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: { lineTotal: "desc" },
      },
      take: 10,
    });

    const topItems = top.map((t) => ({
      itemName: t.itemNameSnapshot,
      quantity: t._sum.quantity ?? 0,
      revenue: (t._sum.lineTotal ?? new Prisma.Decimal(0)).toFixed(2),
    }));

    res.json({
      from: from ?? null,
      to: to ?? null,
      totalOrders,
      revenue,
      topItems,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { salesReport };