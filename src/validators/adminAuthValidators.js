const { z } = require("zod");

const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
});

module.exports = { adminLoginSchema };