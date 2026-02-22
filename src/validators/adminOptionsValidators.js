const { z } = require("zod");

// Schema enums from Prisma
const selectionTypeEnum = z.enum(["single", "multi"]);

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
});

const createOptionGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    selectionType: selectionTypeEnum,
    isRequired: z.boolean(),
    sortOrder: z.number().int().optional(),
  }),
});

const updateOptionGroupSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    selectionType: selectionTypeEnum.optional(),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(), // allowed because schema has isActive
  }),
});

const decimalString = z.string().regex(/^\d+(\.\d{1,2})?$/, "must be a decimal string like 30.00");

const createOptionSchema = z.object({
  body: z.object({
    optionGroupId: z.number().int().positive(),
    label: z.string().trim().min(1),
    priceDelta: decimalString,
    sortOrder: z.number().int().optional(),
  }),
});

const updateOptionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    optionGroupId: z.number().int().positive().optional(),
    label: z.string().trim().min(1).optional(),
    priceDelta: decimalString.optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

const setItemOptionGroupsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a positive integer"),
  }),
  body: z.object({
    optionGroupIds: z.array(z.number().int().positive()).min(0),
  }),
});

module.exports = {
  idParamSchema,
  createOptionGroupSchema,
  updateOptionGroupSchema,
  createOptionSchema,
  updateOptionSchema,
  setItemOptionGroupsSchema,
};