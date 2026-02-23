const { prisma } = require("../db/prisma");const { Prisma } = require("@prisma/client");
const { uploadBufferToCloudinary } = require("../services/imageService");

function parsePositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseDecimalString(val) {
  if (typeof val !== "string") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(val)) return null;
  return new Prisma.Decimal(val);
}

// POST /api/admin/items
// Supports:
// - JSON: { categoryId, name, description, basePrice: "150.00", imageUrl?: string|null }
// - multipart/form-data: fields + optional file "image"
async function createItem(req, res, next) {
  try {
    const isMultipart = req.is("multipart/form-data");

    let categoryId, name, description, basePriceStr, imageUrl;

    if (isMultipart) {
      categoryId = parsePositiveInt(req.body.categoryId);
      name = (req.body.name || "").trim();
      description = (req.body.description || "").trim();
      basePriceStr = req.body.basePrice;
      imageUrl = req.body.imageUrl ? String(req.body.imageUrl) : null;
    } else {
      // JSON
      categoryId = req.body.categoryId;
      name = (req.body.name || "").trim();
      description = (req.body.description || "").trim();
      basePriceStr = req.body.basePrice;
      imageUrl = req.body.imageUrl ?? null;
    }

    // Required checks (no guessing)
    if (!categoryId) return res.status(400).json({ message: "categoryId is required and must be a positive integer" });
    if (!name) return res.status(400).json({ message: "name is required" });
    if (!description) return res.status(400).json({ message: "description is required" });

    const basePrice = isMultipart ? parseDecimalString(basePriceStr) : parseDecimalString(String(basePriceStr));
    if (!basePrice) return res.status(400).json({ message: "basePrice is required and must be a decimal string e.g. 150.00" });

    // Ensure category exists (prevents foreign key errors)
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!cat) return res.status(400).json({ message: "Invalid categoryId" });

    // If file is present, upload to Cloudinary and override imageUrl
    if (req.file?.buffer) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, "boba-items");
      imageUrl = uploaded.secure_url;
    }

    const created = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        basePrice,
        imageUrl: imageUrl || null,
        isActive: true,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        isActive: true,
      },
    });

    res.status(201).json({
      ...created,
      basePrice: created.basePrice.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/items/:id
// Supports JSON or multipart/form-data with optional "image" file
async function updateItem(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid item id" });

    const existing = await prisma.menuItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Item not found" });

    const isMultipart = req.is("multipart/form-data");
    const data = {};

    if (isMultipart) {
      if (req.body.categoryId !== undefined) {
        const categoryId = parsePositiveInt(req.body.categoryId);
        if (!categoryId) return res.status(400).json({ message: "categoryId must be a positive integer" });

        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
        if (!cat) return res.status(400).json({ message: "Invalid categoryId" });

        data.categoryId = categoryId;
      }

      if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) return res.status(400).json({ message: "name cannot be empty" });
        data.name = name;
      }

      if (req.body.description !== undefined) {
        const description = String(req.body.description).trim();
        if (!description) return res.status(400).json({ message: "description cannot be empty" });
        data.description = description;
      }

      if (req.body.basePrice !== undefined) {
        const basePrice = parseDecimalString(String(req.body.basePrice));
        if (!basePrice) return res.status(400).json({ message: "basePrice must be decimal string e.g. 150.00" });
        data.basePrice = basePrice;
      }

      if (req.body.imageUrl !== undefined) {
        const imageUrl = req.body.imageUrl ? String(req.body.imageUrl) : null;
        data.imageUrl = imageUrl;
      }
    } else {
      // JSON
      if (req.body.categoryId !== undefined) {
        const categoryId = req.body.categoryId;
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
          return res.status(400).json({ message: "categoryId must be a positive integer" });
        }
        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
        if (!cat) return res.status(400).json({ message: "Invalid categoryId" });
        data.categoryId = categoryId;
      }

      if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) return res.status(400).json({ message: "name cannot be empty" });
        data.name = name;
      }

      if (req.body.description !== undefined) {
        const description = String(req.body.description).trim();
        if (!description) return res.status(400).json({ message: "description cannot be empty" });
        data.description = description;
      }

      if (req.body.basePrice !== undefined) {
        const basePrice = parseDecimalString(String(req.body.basePrice));
        if (!basePrice) return res.status(400).json({ message: "basePrice must be decimal string e.g. 150.00" });
        data.basePrice = basePrice;
      }

      if (req.body.imageUrl !== undefined) {
        data.imageUrl = req.body.imageUrl;
      }
    }

    // Cloudinary file overrides imageUrl if present
    if (req.file?.buffer) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, "boba-items");
      data.imageUrl = uploaded.secure_url;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        isActive: true,
      },
    });

    res.json({
      ...updated,
      basePrice: updated.basePrice.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/items/:id/active
async function setItemActive(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid item id" });

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const existing = await prisma.menuItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Item not found" });

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
async function listItems(req, res, next) {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { id: "asc" },
      include: {
        category: true, // optional
      },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
}

module.exports = { createItem, updateItem, setItemActive, listItems };