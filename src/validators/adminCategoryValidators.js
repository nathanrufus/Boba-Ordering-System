const { z } = require("zod");

const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
});

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    sortOrder: z.number().int().optional().default(0),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const setCategoryActiveSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

module.exports = {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  setCategoryActiveSchema,
};