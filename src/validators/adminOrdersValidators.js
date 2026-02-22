const { z } = require("zod");

const allowedStatuses = ["NEW", "PREPARING", "DONE", "CANCELLED"];

const listOrdersQuerySchema = z.object({
  query: z.object({
    status: z.enum(allowedStatuses).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .refine((n) => Number.isInteger(n) && n >= 1, "page must be >= 1"),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20))
      .refine((n) => Number.isInteger(n) && n >= 1 && n <= 100, "limit must be 1..100"),
  }),
});

const orderIdParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .transform((v) => parseInt(v, 10))
      .refine((n) => Number.isInteger(n) && n > 0, "id must be a positive integer"),
  }),
});

const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .transform((v) => parseInt(v, 10))
      .refine((n) => Number.isInteger(n) && n > 0, "id must be a positive integer"),
  }),
  body: z.object({
    status: z.enum(allowedStatuses),
  }),
});

module.exports = {
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
};