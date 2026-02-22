const { z } = require("zod");

const orderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  selectedOptionIds: z.array(z.number().int().positive()).default([]),
});

const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().trim().min(1),
    customerPhone: z.string().trim().min(6), // keep simple; adjust if you want stricter
    fulfillmentType: z.enum(["pickup", "delivery"]),
    deliveryAddress: z.string().trim().nullable(),
    customerNote: z.string().trim().nullable().optional(),
    items: z.array(orderItemSchema).min(1),
  }).superRefine((data, ctx) => {
    if (data.fulfillmentType === "delivery") {
      if (!data.deliveryAddress || data.deliveryAddress.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deliveryAddress is required for delivery orders",
          path: ["deliveryAddress"],
        });
      }
    }
  }),
});

const orderNumberParamSchema = z.object({
  params: z.object({
    orderNumber: z.string().trim().min(1),
  }),
});

module.exports = { createOrderSchema, orderNumberParamSchema };