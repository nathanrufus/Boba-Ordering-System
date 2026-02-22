require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

async function upsertAdmin() {
  const email = requireEnv("ADMIN_SEED_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_SEED_PASSWORD");
  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert admin user (keep role OWNER by default)
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      email,
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  return admin;
}

async function seedMenu() {
  // --- Categories (MVP) ---
  const categories = [
    { name: "Milk Tea", sortOrder: 1 },
    { name: "Fruit Tea", sortOrder: 2 },
    { name: "Snacks", sortOrder: 3 },
  ];

  const categoryRows = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { name: c.name },
      update: { sortOrder: c.sortOrder, isActive: true },
      create: { name: c.name, sortOrder: c.sortOrder, isActive: true },
    });
    categoryRows[c.name] = row;
  }

  // --- Menu Items (minimal MVP samples) ---
  const items = [
    {
      category: "Milk Tea",
      name: "Classic Milk Tea",
      description: "Black tea with milk.",
      basePrice: "150.00",
      imageUrl: null,
    },
    {
      category: "Milk Tea",
      name: "Taro Milk Tea",
      description: "Creamy taro flavor.",
      basePrice: "170.00",
      imageUrl: null,
    },
    {
      category: "Fruit Tea",
      name: "Mango Fruit Tea",
      description: "Refreshing mango tea.",
      basePrice: "160.00",
      imageUrl: null,
    },
    {
      category: "Snacks",
      name: "Fries",
      description: "Crispy fries.",
      basePrice: "120.00",
      imageUrl: null,
    },
  ];

  const itemRows = {};
  for (const it of items) {
    const categoryId = categoryRows[it.category].id;

    const row = await prisma.menuItem.upsert({
      where: {
        // No unique constraint on name in schema, so we use a composite-like lookup:
        // We'll find first, then update/create.
        // Prisma upsert needs unique where; so do findFirst then update/create.
        // We'll implement safely below.
        id: -1, // dummy, will not be used
      },
      update: {},
      create: {},
    }).catch(() => null);

    // Safe approach without unique constraint: findFirst -> update/create
    const existing = await prisma.menuItem.findFirst({
      where: { name: it.name, categoryId },
    });

    const finalRow = existing
      ? await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            description: it.description,
            basePrice: it.basePrice,
            imageUrl: it.imageUrl,
            isActive: true,
          },
        })
      : await prisma.menuItem.create({
          data: {
            categoryId,
            name: it.name,
            description: it.description,
            basePrice: it.basePrice,
            imageUrl: it.imageUrl,
            isActive: true,
          },
        });

    itemRows[it.name] = finalRow;
  }

  // --- Option Groups (MVP) ---
  const optionGroups = [
    { name: "Size", selectionType: "single", isRequired: true, sortOrder: 1 },
    { name: "Sugar", selectionType: "single", isRequired: true, sortOrder: 2 },
    { name: "Ice", selectionType: "single", isRequired: true, sortOrder: 3 },
    { name: "Toppings", selectionType: "multi", isRequired: false, sortOrder: 4 },
  ];

  const groupRows = {};
  for (const g of optionGroups) {
    const row = await prisma.optionGroup.upsert({
      where: { name: g.name },
      update: {
        selectionType: g.selectionType,
        isRequired: g.isRequired,
        sortOrder: g.sortOrder,
        isActive: true,
      },
      create: {
        name: g.name,
        selectionType: g.selectionType,
        isRequired: g.isRequired,
        sortOrder: g.sortOrder,
        isActive: true,
      },
    });
    groupRows[g.name] = row;
  }

  // --- Options (minimal MVP) ---
  const optionsByGroup = {
    Size: [
      { label: "Small", priceDelta: "0.00", sortOrder: 1 },
      { label: "Medium", priceDelta: "15.00", sortOrder: 2 },
      { label: "Large", priceDelta: "30.00", sortOrder: 3 },
    ],
    Sugar: [
      { label: "0%", priceDelta: "0.00", sortOrder: 1 },
      { label: "25%", priceDelta: "0.00", sortOrder: 2 },
      { label: "50%", priceDelta: "0.00", sortOrder: 3 },
      { label: "75%", priceDelta: "0.00", sortOrder: 4 },
      { label: "100%", priceDelta: "0.00", sortOrder: 5 },
    ],
    Ice: [
      { label: "No Ice", priceDelta: "0.00", sortOrder: 1 },
      { label: "Less Ice", priceDelta: "0.00", sortOrder: 2 },
      { label: "Regular Ice", priceDelta: "0.00", sortOrder: 3 },
      { label: "Extra Ice", priceDelta: "0.00", sortOrder: 4 },
    ],
    Toppings: [
      { label: "Boba", priceDelta: "20.00", sortOrder: 1 },
      { label: "Pudding", priceDelta: "25.00", sortOrder: 2 },
      { label: "Jelly", priceDelta: "20.00", sortOrder: 3 },
    ],
  };

  for (const [groupName, opts] of Object.entries(optionsByGroup)) {
    const groupId = groupRows[groupName].id;

    for (const o of opts) {
      await prisma.option.upsert({
        where: { optionGroupId_label: { optionGroupId: groupId, label: o.label } },
        update: {
          priceDelta: o.priceDelta,
          sortOrder: o.sortOrder,
          isActive: true,
        },
        create: {
          optionGroupId: groupId,
          label: o.label,
          priceDelta: o.priceDelta,
          sortOrder: o.sortOrder,
          isActive: true,
        },
      });
    }
  }

  // --- Map option groups to items ---
  // Apply all 4 groups to tea items; apply none to snacks.
  const teaItemNames = ["Classic Milk Tea", "Taro Milk Tea", "Mango Fruit Tea"];
  const groupIdsForTea = Object.values(groupRows).map((g) => g.id);

  // Replace mappings for each tea item (transaction per item to keep consistent)
  for (const itemName of teaItemNames) {
    const item = itemRows[itemName];
    if (!item) continue;

    await prisma.$transaction(async (tx) => {
      await tx.menuItemOptionGroup.deleteMany({
        where: { menuItemId: item.id },
      });

      await tx.menuItemOptionGroup.createMany({
        data: groupIdsForTea.map((gid) => ({
          menuItemId: item.id,
          optionGroupId: gid,
        })),
        skipDuplicates: true,
      });
    });
  }

  return { categories: categoryRows, items: itemRows, groups: groupRows };
}

async function main() {
  const admin = await upsertAdmin();
  await seedMenu();

  console.log("✅ Seed complete");
  console.log(`Admin: ${admin.email} (${admin.role})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });