const { prisma } = require("../db/prisma");
const { computeOrderFromSelections } = require("../services/orderPricingService");

async function createOrder(req, res, next) {
  try {
    const payload = req.body;

    // ----------------------------
    // ✅ Payment validation (no assumptions)
    // ----------------------------
    const paymentMethod = payload?.paymentMethod;

    if (!paymentMethod || !["E_BIRR", "CBE"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "paymentMethod is required and must be one of: E_BIRR, CBE",
      });
    }

    // Until screenshot upload exists, enforce reference for CBE
    if (paymentMethod === "CBE") {
      const hasReference = String(payload?.cbeReference ?? "").trim().length > 0;
      if (!hasReference) {
        return res.status(400).json({
          message: "For CBE payments, cbeReference is required (until screenshot upload is implemented).",
        });
      }
    }

    // 1) Validate selections + compute pricing using DB
    const computed = await computeOrderFromSelections(payload);

    // 2) Transaction: create order + items + item options + orderNumber
    const result = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: "PENDING",

          // ✅ Set required status for payment verification flow
          status: "PENDING_VERIFICATION",

          customerName: computed.customerName,
          customerPhone: computed.customerPhone,
          fulfillmentType: computed.fulfillmentType,
          deliveryAddress: computed.deliveryAddress,
          customerNote: computed.customerNote ?? null,

          subtotal: computed.subtotal,

          // ✅ Payment snapshot fields
          paymentMethod: paymentMethod,
          paymentAmount: computed.subtotal,
          transactionId: payload.transactionId ? String(payload.transactionId).trim() : null,
          cbeReference: payload.cbeReference ? String(payload.cbeReference).trim() : null,
          paymentProofImageUrl: payload.paymentProofImageUrl ? String(payload.paymentProofImageUrl).trim() : null,
          paidAt: new Date(),

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
            unitPriceSnapshot: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          },
        });

        if (item.options.length > 0) {
          await tx.orderItemOption.createMany({
            data: item.options.map((opt) => ({
              orderItemId: createdItem.id,
              optionId: opt.optionId,
              optionGroupNameSnapshot: opt.group,
              optionLabelSnapshot: opt.label,
              optionPriceDeltaSnapshot: opt.priceDelta,
            })),
          });
        }
      }

      return { order: updatedOrder };
    });

    // Return API response shape (+ payment fields needed for confirmation page)
    res.status(201).json({
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      subtotal: computed.subtotalStr,

      paymentMethod: paymentMethod,
      paidAt: new Date().toISOString(),
      transactionId: payload.transactionId ? String(payload.transactionId).trim() : null,
      cbeReference: payload.cbeReference ? String(payload.cbeReference).trim() : null,
      paymentProofImageUrl: payload.paymentProofImageUrl ? String(payload.paymentProofImageUrl).trim() : null,

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

    const summary = {
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.itemNameSnapshot,
        quantity: it.quantity,
        unitPrice: it.unitPriceSnapshot?.toFixed
          ? it.unitPriceSnapshot.toFixed(2)
          : String(it.unitPriceSnapshot),
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

        // ✅ ADD THESE
        customerName: order.customerName ?? null,
        customerPhone: order.customerPhone ?? null,
        customerNote: order.customerNote ?? null,
        fulfillmentType: order.fulfillmentType ?? null,
        deliveryAddress: order.deliveryAddress ?? null,

        // payment fields...
        paymentMethod: order.paymentMethod,
        paymentAmount: order.paymentAmount?.toFixed
          ? order.paymentAmount.toFixed(2)
          : order.paymentAmount
            ? String(order.paymentAmount)
            : null,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        transactionId: order.transactionId ?? null,
        cbeReference: order.cbeReference ?? null,
        paymentProofImageUrl: order.paymentProofImageUrl ?? null,

        whatsappDeeplink: order.whatsappDeeplink,
        summary,
      });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrderByOrderNumber };