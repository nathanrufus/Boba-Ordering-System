const express = require("express");
const { prisma } = require("../db/prisma");

const router = express.Router();

/**
 * GET /api/menu
 * Returns active categories -> active items -> applicable option groups -> active options
 * Works even if DB is empty.
 */
router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { id: "asc" },
          include: {
            itemGroups: {
              include: {
                optionGroup: {
                  include: {
                    options: {
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const response = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        items: c.items.map((i) => {
          // Build option groups (mapped) and filter actives in JS
          const optionGroups = (i.itemGroups || [])
            .map((ig) => ig.optionGroup)
            .filter((g) => g && g.isActive)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((g) => ({
              id: g.id,
              name: g.name,
              selectionType: g.selectionType,
              isRequired: g.isRequired,
              options: (g.options || [])
                .filter((o) => o.isActive)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((o) => ({
                  id: o.id,
                  label: o.label,
                  priceDelta: o.priceDelta?.toFixed
                    ? o.priceDelta.toFixed(2)
                    : String(o.priceDelta),
                })),
            }));

          return {
            id: i.id,
            name: i.name,
            description: i.description,
            basePrice: i.basePrice?.toFixed
              ? i.basePrice.toFixed(2)
              : String(i.basePrice),
            imageUrl: i.imageUrl,
            optionGroups,
          };
        }),
      })),
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;