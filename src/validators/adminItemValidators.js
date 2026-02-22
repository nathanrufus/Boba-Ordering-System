const { z } = require("zod");

const itemIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
});

// For JSON requests (Content-Type: application/json)
const createItemJsonSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive(),
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "basePrice must be decimal string e.g. 150.00"),
    imageUrl: z.string().url().nullable().optional(),
  }),
});

// PATCH JSON (partial)
const updateItemJsonSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    imageUrl: z.string().url().nullable().optional(),
  }),
});

const setItemActiveSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

module.exports = {
  itemIdParamSchema,
  createItemJsonSchema,
  updateItemJsonSchema,
  setItemActiveSchema,
};