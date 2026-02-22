const prisma = require("../db/prisma");
const { buildWhatsAppTextAndLink } = require("../services/whatsappService");
const { computeOrderFromSelections } = require("../services/orderPricingService");

async function createOrder(req, res, next) {
  try {
    const payload = req.body;

    // 1) Validate selections + compute pricing using DB
    const computed = await computeOrderFromSelections(payload);

    // computed contains:
    // - orderCreateData
    // - orderItemsCreateData
    // - responseShape for the API

    // 2) Transaction: create order + items + item options + orderNumber
    const result = await prisma.$transaction(async (tx) => {
      // Create order first (orderNumber set after we get id)
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: "PENDING",
          status: "NEW",
          customerName: computed.customerName,
          customerPhone: computed.customerPhone,
          fulfillmentType: computed.fulfillmentType,
          deliveryAddress: computed.deliveryAddress,
          customerNote: computed.customerNote ?? null,
          subtotal: computed.subtotal, // Decimal-compatible
          whatsappMessageText: computed.whatsappMessageText,
          whatsappDeeplink: computed.whatsappDeeplink,
        },
      });

      // Generate formatted order number BB-YYYY-000123 using created id
      const year = new Date().getFullYear();
      const padded = String(createdOrder.id).padStart(6, "0");
      const finalOrderNumber = `BB-${year}-${padded}`;

      const updatedOrder = await tx.order.update({
        where: { id: createdOrder.id },
        data: { orderNumber: finalOrderNumber },
      });

      // Create order items + options (snapshots)
      for (const item of computed.items) {
        const createdItem = await tx.orderItem.create({
          data: {
            orderId: updatedOrder.id,
            menuItemId: item.menuItemId,
            itemNameSnapshot: item.name,
            unitPriceSnapshot: item.unitPrice, // Decimal
            quantity: item.quantity,
            lineTotal: item.lineTotal, // Decimal
          },
        });

        if (item.options.length > 0) {
          await tx.orderItemOption.createMany({
            data: item.options.map((opt) => ({
              orderItemId: createdItem.id,
              optionId: opt.optionId,
              optionGroupNameSnapshot: opt.group,
              optionLabelSnapshot: opt.label,
              optionPriceDeltaSnapshot: opt.priceDelta, // Decimal
            })),
          });
        }
      }

      return { order: updatedOrder };
    });

    // Return exact API response shape
    res.status(201).json({
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      subtotal: computed.subtotalStr,
      whatsappDeeplink: computed.whatsappDeeplink,
      summary: computed.summary,
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderByOrderNumber(req, res, next) {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            options: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Shape a minimal public summary (same as create response, safe)
    const summary = {
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.itemNameSnapshot,
        quantity: it.quantity,
        unitPrice: it.unitPriceSnapshot?.toFixed ? it.unitPriceSnapshot.toFixed(2) : String(it.unitPriceSnapshot),
        options: it.options.map((o) => ({
          group: o.optionGroupNameSnapshot,
          label: o.optionLabelSnapshot,
          priceDelta: o.optionPriceDeltaSnapshot?.toFixed
            ? o.optionPriceDeltaSnapshot.toFixed(2)
            : String(o.optionPriceDeltaSnapshot),
        })),
        lineTotal: it.lineTotal?.toFixed ? it.lineTotal.toFixed(2) : String(it.lineTotal),
      })),
    };

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal?.toFixed ? order.subtotal.toFixed(2) : String(order.subtotal),
      whatsappDeeplink: order.whatsappDeeplink,
      summary,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrderByOrderNumber };