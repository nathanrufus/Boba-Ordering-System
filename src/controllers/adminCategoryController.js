const { prisma } = require("../db/prisma");
function parseId(idStr) {
  const n = Number(idStr);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// POST /api/admin/categories
async function createCategory(req, res, next) {
  try {
    const { name, sortOrder } = req.body;

    const created = await prisma.category.create({
      data: {
        name,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
      select: { id: true, name: true, sortOrder: true, isActive: true },
    });

    res.status(201).json(created);
  } catch (err) {
    // Unique constraint on Category.name
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Category name already exists" });
    }
    next(err);
  }
}

// PATCH /api/admin/categories/:id
async function updateCategory(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category id" });

    const { name, sortOrder } = req.body;

    // ensure exists
    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ message: "Category not found" });

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
      select: { id: true, name: true, sortOrder: true, isActive: true },
    });

    res.json(updated);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Category name already exists" });
    }
    next(err);
  }
}

// PATCH /api/admin/categories/:id/active
async function setCategoryActive(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category id" });

    const { isActive } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ message: "Category not found" });

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    // minimal response is fine; if you want more fields, expand select
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json(categories);
  } catch (e) {
    next(e);
  }
}

module.exports = { createCategory, updateCategory, setCategoryActive, listCategories };