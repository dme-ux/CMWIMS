// ============================================================================
//  CMW ERP — Database Seed
//  Creates one login per role, core masters, and sample inventory.
//  Run: npm run db:seed
// ============================================================================
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log("Seeding CMW ERP…");

  // ---- Users (default password for every account: Cmw@2025) ----
  const users: { name: string; username: string; role: Role }[] = [
    { name: "Sunil Tiwari", username: "admin", role: "ADMIN" },
    { name: "Operations Manager", username: "manager", role: "MANAGER" },
    { name: "Store Manager", username: "store", role: "STORE_MANAGER" },
    { name: "Accounts Executive", username: "accounts", role: "ACCOUNTS" },
    { name: "Purchase Officer", username: "purchase", role: "PURCHASE" },
    { name: "Workshop Head", username: "workshop", role: "WORKSHOP" },
    { name: "Service Advisor", username: "advisor", role: "SERVICE_ADVISOR" },
    { name: "Lead Technician", username: "tech", role: "TECHNICIAN" },
    { name: "Read-only User", username: "viewer", role: "VIEWER" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        username: u.username,
        email: `${u.username}@capitalmotorworks.in`,
        passwordHash: hash("Cmw@2025"),
        role: u.role,
      },
    });
  }

  // ---- Masters ----
  const [bmw, mercedes, audi] = await Promise.all([
    prisma.oEMBrand.upsert({ where: { name: "BMW" }, update: {}, create: { name: "BMW" } }),
    prisma.oEMBrand.upsert({ where: { name: "Mercedes-Benz" }, update: {}, create: { name: "Mercedes-Benz" } }),
    prisma.oEMBrand.upsert({ where: { name: "Audi" }, update: {}, create: { name: "Audi" } }),
  ]);

  const m5 = await prisma.vehicleModel.upsert({
    where: { name_oemBrandId: { name: "5 Series G30", oemBrandId: bmw.id } },
    update: {}, create: { name: "5 Series G30", oemBrandId: bmw.id },
  });
  await prisma.vehicleModel.upsert({
    where: { name_oemBrandId: { name: "E-Class W213", oemBrandId: mercedes.id } },
    update: {}, create: { name: "E-Class W213", oemBrandId: mercedes.id },
  });

  const brakes = await prisma.category.upsert({ where: { name: "Brakes" }, update: {}, create: { name: "Brakes" } });
  const filters = await prisma.category.upsert({ where: { name: "Filters" }, update: {}, create: { name: "Filters" } });
  const nos = await prisma.unit.upsert({ where: { name: "Nos" }, update: {}, create: { name: "Nos", symbol: "Nos" } });
  const hsn = await prisma.hSNCode.upsert({ where: { code: "87083000" }, update: {}, create: { code: "87083000", gstRate: 28 } });

  const wh = await prisma.warehouse.upsert({ where: { name: "Main Store" }, update: {}, create: { name: "Main Store", address: "Capital Motor Works, Service Bay" } });
  const rack = await prisma.rack.upsert({ where: { name_warehouseId: { name: "R-01", warehouseId: wh.id } }, update: {}, create: { name: "R-01", warehouseId: wh.id } });
  const shelf = await prisma.shelf.upsert({ where: { name_rackId: { name: "S-01", rackId: rack.id } }, update: {}, create: { name: "S-01", rackId: rack.id } });
  const bin = await prisma.bin.upsert({ where: { name_shelfId: { name: "B-01", shelfId: shelf.id } }, update: {}, create: { name: "B-01", shelfId: shelf.id } });

  const vendor = await prisma.vendor.upsert({
    where: { code: "VEN-001" }, update: {},
    create: { code: "VEN-001", name: "Bavaria Auto Spares", city: "Delhi", state: "Delhi", gstin: "07ABCDE1234F1Z5", paymentTerms: "Net 30" },
  });

  // ---- Sample items ----
  const items = [
    { sku: "CMW-BRK-001", name: "Front Brake Pad Set", partNumber: "34116888456", oemNumber: "BMW-34116888456", categoryId: brakes.id, current: 24, reorder: 8, pr: 4200, sr: 6800, mrp: 7500 },
    { sku: "CMW-BRK-002", name: "Rear Brake Disc", partNumber: "34216792227", oemNumber: "BMW-34216792227", categoryId: brakes.id, current: 6, reorder: 6, pr: 5800, sr: 8900, mrp: 9800 },
    { sku: "CMW-FIL-001", name: "Oil Filter (M-Series)", partNumber: "11428507683", oemNumber: "BMW-11428507683", categoryId: filters.id, current: 0, reorder: 12, pr: 650, sr: 1150, mrp: 1400 },
  ];

  for (const it of items) {
    await prisma.item.upsert({
      where: { sku: it.sku }, update: {},
      create: {
        sku: it.sku, name: it.name, partNumber: it.partNumber, oemNumber: it.oemNumber,
        categoryId: it.categoryId, unitId: nos.id, hsnId: hsn.id, vendorId: vendor.id,
        modelId: m5.id, warehouseId: wh.id, rackId: rack.id, shelfId: shelf.id, binId: bin.id,
        currentStock: it.current, openingStock: it.current, reorderLevel: it.reorder,
        minStock: it.reorder, maxStock: it.reorder * 5,
        purchaseRate: it.pr, sellingRate: it.sr, mrp: it.mrp, averageCost: it.pr, gstRate: 28,
      },
    });
  }

  // ---- Company settings ----
  await prisma.setting.upsert({
    where: { key: "company" }, update: {},
    create: {
      key: "company",
      value: JSON.stringify({
        name: "Capital Motor Works", founder: "Sunil Tiwari",
        email: "Connect@systemmaster.in", phone: "+91 90279 65956", website: "www.systemmaster.in",
      }),
    },
  });

  console.log("Seed complete.  Login with  admin / Cmw@2025");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
