const { z } = require("zod");

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8), // keep MVP simple; can add complexity rules later
  }),
});

module.exports = { changePasswordSchema };