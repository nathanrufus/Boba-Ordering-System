const prisma = require("../db/prisma");
const { Prisma } = require("@prisma/client");
const { buildWhatsAppTextAndLink } = require("./whatsappService");

function toDecimal(n) {
  // Accept strings or numbers; store as Prisma Decimal-compatible
  return new Prisma.Decimal(n);
}

async function computeOrderFromSelections(payload) {
  const {
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryAddress,
    customerNote,
    items,
  } = payload;

  // Collect unique menuItemIds
  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];

  // Fetch menu items + mapping + option groups + options (active only)
  const dbItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, isActive: true },
    include: {
      itemGroups: {
        where: { optionGroup: { isActive: true } },
        include: {
          optionGroup: {
            include: {
              options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  const itemById = new Map(dbItems.map((x) => [x.id, x]));

  // Validate all menuItemIds exist and active
  for (const reqItem of items) {
    if (!itemById.has(reqItem.menuItemId)) {
      const e = new Error(`Invalid menuItemId or inactive: ${reqItem.menuItemId}`);
      e.status = 400;
      throw e;
    }
  }

  // Compute each line
  const computedItems = [];
  let subtotal = new Prisma.Decimal(0);

  for (const reqItem of items) {
    const menuItem = itemById.get(reqItem.menuItemId);
    const basePrice = menuItem.basePrice; // Decimal

    // Allowed groups for this item (via join)
    const allowedGroups = menuItem.itemGroups.map((ig) => ig.optionGroup);

    // Build lookup: optionId -> { groupName, selectionType, isRequired, priceDelta, label }
    const optionLookup = new Map();
    const groupById = new Map();

    for (const g of allowedGroups) {
      groupById.set(g.id, g);
      for (const opt of g.options) {
        optionLookup.set(opt.id, {
          optionId: opt.id,
          groupId: g.id,
          group: g.name,
          selectionType: g.selectionType,
          isRequired: g.isRequired,
          label: opt.label,
          priceDelta: opt.priceDelta,
        });
      }
    }

    // Validate selected options:
    const selected = reqItem.selectedOptionIds || [];
    const perGroupSelectedCount = new Map(); // groupId -> count
    const selectedOptionDetails = [];

    for (const optId of selected) {
      const found = optionLookup.get(optId);
      if (!found) {
        const e = new Error(`Invalid optionId ${optId} for menuItemId ${reqItem.menuItemId}`);
        e.status = 400;
        throw e;
      }
      perGroupSelectedCount.set(found.groupId, (perGroupSelectedCount.get(found.groupId) || 0) + 1);
      selectedOptionDetails.push(found);
    }

    // Single selection rule
    for (const g of allowedGroups) {
      if (g.selectionType === "single") {
        const count = perGroupSelectedCount.get(g.id) || 0;
        if (count > 1) {
          const e = new Error(`Only one option allowed for group "${g.name}" on item ${reqItem.menuItemId}`);
          e.status = 400;
          throw e;
        }
      }
    }

    // Required groups rule
    for (const g of allowedGroups) {
      if (g.isRequired) {
        const count = perGroupSelectedCount.get(g.id) || 0;
        if (count < 1) {
          const e = new Error(`Missing required option for group "${g.name}" on item ${reqItem.menuItemId}`);
          e.status = 400;
          throw e;
        }
      }
    }

    // Price calc
    const optionsDelta = selectedOptionDetails.reduce(
      (acc, o) => acc.add(o.priceDelta),
      new Prisma.Decimal(0)
    );

    const unitPrice = basePrice.add(optionsDelta);
    const lineTotal = unitPrice.mul(new Prisma.Decimal(reqItem.quantity));
    subtotal = subtotal.add(lineTotal);

    computedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: reqItem.quantity,
      unitPrice, // Decimal
      unitPriceStr: unitPrice.toFixed(2),
      lineTotal, // Decimal
      lineTotalStr: lineTotal.toFixed(2),
      options: selectedOptionDetails.map((o) => ({
        optionId: o.optionId,
        group: o.group,
        label: o.label,
        priceDelta: o.priceDelta, // Decimal
        priceDeltaStr: o.priceDelta.toFixed(2),
      })),
    });
  }

  // WhatsApp text + deeplink
  const summary = {
    fulfillmentType,
    deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress : null,
    items: computedItems.map((it) => ({
      menuItemId: it.menuItemId,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPriceStr,
      options: it.options.map((o) => ({
        group: o.group,
        label: o.label,
        priceDelta: o.priceDeltaStr,
      })),
      lineTotal: it.lineTotalStr,
    })),
  };

  const { text, deeplink } = buildWhatsAppTextAndLink({
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryAddress: summary.deliveryAddress,
    customerNote: customerNote ?? null,
    subtotalStr: subtotal.toFixed(2),
    items: summary.items,
  });

  return {
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryAddress: summary.deliveryAddress,
    customerNote: customerNote ?? null,
    items: computedItems,
    subtotal,
    subtotalStr: subtotal.toFixed(2),
    whatsappMessageText: text,
    whatsappDeeplink: deeplink,
    summary,
  };
}

module.exports = { computeOrderFromSelections };