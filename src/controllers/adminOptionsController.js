const { prisma } = require("../db/prisma");
function parsePositiveInt(str) {
  const n = Number(str);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// --------------------
// OPTION GROUPS
// --------------------

// POST /api/admin/option-groups
async function createOptionGroup(req, res, next) {
  try {
    const { name, selectionType, isRequired, sortOrder } = req.body;

    const created = await prisma.optionGroup.create({
      data: {
        name,
        selectionType,          // enum: 'single' | 'multi'
        isRequired,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        selectionType: true,
        isRequired: true,
        sortOrder: true,
        isActive: true,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    // OptionGroup.name is @unique
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Option group name already exists" });
    }
    next(err);
  }
}

// PATCH /api/admin/option-groups/:id
async function updateOptionGroup(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid option group id" });

    const existing = await prisma.optionGroup.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Option group not found" });

    const { name, selectionType, isRequired, sortOrder, isActive } = req.body;

    const updated = await prisma.optionGroup.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(selectionType !== undefined ? { selectionType } : {}),
        ...(isRequired !== undefined ? { isRequired } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        selectionType: true,
        isRequired: true,
        sortOrder: true,
        isActive: true,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Option group name already exists" });
    }
    next(err);
  }
}

// --------------------
// OPTIONS
// --------------------

// POST /api/admin/options
async function createOption(req, res, next) {
  try {
    const { optionGroupId, label, priceDelta, sortOrder } = req.body;

    // ensure optionGroup exists (prevents FK error)
    const og = await prisma.optionGroup.findUnique({
      where: { id: optionGroupId },
      select: { id: true },
    });
    if (!og) return res.status(400).json({ message: "Invalid optionGroupId" });

    const created = await prisma.option.create({
      data: {
        optionGroupId,
        label,
        priceDelta, // Prisma Decimal accepts string
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
      select: {
        id: true,
        optionGroupId: true,
        label: true,
        priceDelta: true,
        sortOrder: true,
        isActive: true,
      },
    });

    res.status(201).json({
      ...created,
      priceDelta: created.priceDelta.toFixed(2),
    });
  } catch (err) {
    // @@unique([optionGroupId, label])
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Option label already exists in this group" });
    }
    next(err);
  }
}

// PATCH /api/admin/options/:id
async function updateOption(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid option id" });

    const existing = await prisma.option.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Option not found" });

    const { optionGroupId, label, priceDelta, sortOrder, isActive } = req.body;

    // if moving option to another group, ensure group exists
    if (optionGroupId !== undefined) {
      const og = await prisma.optionGroup.findUnique({
        where: { id: optionGroupId },
        select: { id: true },
      });
      if (!og) return res.status(400).json({ message: "Invalid optionGroupId" });
    }

    const updated = await prisma.option.update({
      where: { id },
      data: {
        ...(optionGroupId !== undefined ? { optionGroupId } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(priceDelta !== undefined ? { priceDelta } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        optionGroupId: true,
        label: true,
        priceDelta: true,
        sortOrder: true,
        isActive: true,
      },
    });

    res.json({
      ...updated,
      priceDelta: updated.priceDelta.toFixed(2),
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Option label already exists in this group" });
    }
    next(err);
  }
}

// --------------------
// APPLY OPTION GROUPS TO ITEM (REPLACE MAPPING)
// --------------------

// POST /api/admin/items/:id/option-groups
async function setItemOptionGroups(req, res, next) {
  try {
    const menuItemId = parsePositiveInt(req.params.id);
    if (!menuItemId) return res.status(400).json({ message: "Invalid item id" });

    const { optionGroupIds } = req.body;

    // ensure menu item exists
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true },
    });
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    // Deduplicate ids to avoid composite PK conflicts
    const uniqueIds = [...new Set(optionGroupIds)];

    // ensure all option groups exist
    if (uniqueIds.length > 0) {
      const found = await prisma.optionGroup.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });

      if (found.length !== uniqueIds.length) {
        return res.status(400).json({ message: "One or more optionGroupIds are invalid" });
      }
    }

    // Replace mapping in ONE transaction (required)
    await prisma.$transaction(async (tx) => {
      await tx.menuItemOptionGroup.deleteMany({
        where: { menuItemId },
      });

      if (uniqueIds.length > 0) {
        await tx.menuItemOptionGroup.createMany({
          data: uniqueIds.map((optionGroupId) => ({
            menuItemId,
            optionGroupId,
          })),
        });
      }
    });

    res.json({ menuItemId, optionGroupIds: uniqueIds });
  } catch (err) {
    next(err);
  }
}
async function listOptionGroups(req, res, next) {
  try {
    const groups = await prisma.optionGroup.findMany({
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } }, // optional
    });
    res.json(groups);
  } catch (e) {
    next(e);
  }
}

async function listOptions(req, res, next) {
  try {
    const optionGroupId = req.query.optionGroupId ? Number(req.query.optionGroupId) : undefined;

    const options = await prisma.option.findMany({
      where: optionGroupId ? { optionGroupId } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    res.json(options);
  } catch (e) {
    next(e);
  }
}
module.exports = {
  createOptionGroup,
  updateOptionGroup,
  createOption,
  updateOption,
  setItemOptionGroups,
  listOptionGroups,
  listOptions
};