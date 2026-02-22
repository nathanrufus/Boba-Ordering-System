// seed/seed.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../src/db/prisma");

async function main() {
  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bobabros.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminRole = process.env.ADMIN_ROLE || "OWNER";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: adminRole,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: adminRole,
      isActive: true,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });

  // Category
  const category = await prisma.category.upsert({
    where: { name: "Milk Tea" },
    update: { sortOrder: 1, isActive: true },
    create: { name: "Milk Tea", sortOrder: 1, isActive: true },
    select: { id: true, name: true },
  });

  // MenuItem (no unique field, so use findFirst)
  let item = await prisma.menuItem.findFirst({
    where: { name: "Classic Milk Tea", categoryId: category.id },
    select: { id: true },
  });

  if (!item) {
    item = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: "Classic Milk Tea",
        description: "Black tea + milk",
        basePrice: "150.00",
        imageUrl: null,
        isActive: true,
      },
      select: { id: true },
    });
  } else {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        description: "Black tea + milk",
        basePrice: "150.00",
        imageUrl: null,
        isActive: true,
      },
    });
  }

  // OptionGroup (recommended)
  const sizeGroup = await prisma.optionGroup.upsert({
    where: { name: "Size" },
    update: {
      selectionType: "single",
      isRequired: true,
      sortOrder: 1,
      isActive: true,
    },
    create: {
      name: "Size",
      selectionType: "single",
      isRequired: true,
      sortOrder: 1,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  // Options (recommended)
  async function upsertOption(optionGroupId, label, priceDelta, sortOrder) {
    const existing = await prisma.option.findFirst({
      where: { optionGroupId, label },
      select: { id: true },
    });

    if (!existing) {
      return prisma.option.create({
        data: {
          optionGroupId,
          label,
          priceDelta,
          sortOrder,
          isActive: true,
        },
      });
    }

    return prisma.option.update({
      where: { id: existing.id },
      data: {
        priceDelta,
        sortOrder,
        isActive: true,
      },
    });
  }

  await upsertOption(sizeGroup.id, "Small", "0.00", 1);
  await upsertOption(sizeGroup.id, "Large", "30.00", 2);

  // Map option group to item (required for /api/menu to show optionGroups)
  await prisma.menuItemOptionGroup.createMany({
    data: [{ menuItemId: item.id, optionGroupId: sizeGroup.id }],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete");
  console.log("Admin:", admin.email, admin.role);
  console.log("Category:", category.name, "ID:", category.id);
  console.log("MenuItem:", "Classic Milk Tea", "ID:", item.id);
  console.log("OptionGroup:", sizeGroup.name, "ID:", sizeGroup.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });