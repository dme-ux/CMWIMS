-- ============================================================================
--  CMW ERP — Full Database Setup (Supabase SQL Editor)
--  Capital Motor Works · Smart Inventory & Workshop Management System
--
--  HOW TO RUN:
--    Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--  Creates every table, index, foreign key, and sample data (incl. logins).
--  Safe to re-run: it drops and recreates the schema cleanly.
--
--  Default login password for every user:  Cmw@2025
-- ============================================================================

-- Fresh start (removes old CMW tables/types if re-running) -------------------
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ---- Enums ----------------------------------------------------------------
CREATE TYPE "Role" AS ENUM ('ADMIN','MANAGER','STORE_MANAGER','ACCOUNTS','PURCHASE','WORKSHOP','SERVICE_ADVISOR','TECHNICIAN','VIEWER');
CREATE TYPE "MovementType" AS ENUM ('INWARD_GRN','OUTWARD_ISSUE','WORKSHOP_CONSUMPTION','CUSTOMER_SALE','INTERNAL_TRANSFER','DAMAGE','RETURN_IN','VENDOR_RETURN','ADJUSTMENT','OPENING');
CREATE TYPE "POStatus" AS ENUM ('DRAFT','PENDING_APPROVAL','APPROVED','SENT','PARTIALLY_RECEIVED','RECEIVED','CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID','PARTIAL','PAID');
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT','PENDING','APPROVED','CONVERTED','REJECTED');
CREATE TYPE "WorkshopStatus" AS ENUM ('RECEIVED','IN_PROGRESS','WAITING_PARTS','READY','DELIVERED','CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK','PENDING_PAYMENT','PURCHASE_APPROVAL','MATERIAL_RECEIVED','ORDER_COMPLETED','SYSTEM');

-- ---- Tables ---------------------------------------------------------------
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'VIEWER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "avatarUrl" TEXT,
  "phone" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vendor" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "gstin" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "paymentTerms" TEXT,
  "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "gstin" TEXT,
  "address" TEXT,
  "city" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OEMBrand" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "VehicleModel" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "oemBrandId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleModel_name_oemBrandId_key" UNIQUE ("name","oemBrandId")
);

CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "registration" TEXT UNIQUE,
  "vin" TEXT,
  "chassisNumber" TEXT,
  "engineNumber" TEXT,
  "year" INTEGER,
  "color" TEXT,
  "customerId" TEXT,
  "modelId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Brand" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SubCategory" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubCategory_name_categoryId_key" UNIQUE ("name","categoryId")
);

CREATE TABLE "Unit" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "symbol" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "HSNCode" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Warehouse" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Rack" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rack_name_warehouseId_key" UNIQUE ("name","warehouseId")
);

CREATE TABLE "Shelf" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "rackId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shelf_name_rackId_key" UNIQUE ("name","rackId")
);

CREATE TABLE "Bin" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "shelfId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Bin_name_shelfId_key" UNIQUE ("name","shelfId")
);

CREATE TABLE "Item" (
  "id" TEXT PRIMARY KEY,
  "sku" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "partNumber" TEXT,
  "oemNumber" TEXT,
  "barcode" TEXT UNIQUE,
  "qrCode" TEXT,
  "imageUrl" TEXT,
  "brandId" TEXT,
  "categoryId" TEXT,
  "subCategoryId" TEXT,
  "modelId" TEXT,
  "unitId" TEXT,
  "hsnId" TEXT,
  "vendorId" TEXT,
  "warehouseId" TEXT,
  "rackId" TEXT,
  "shelfId" TEXT,
  "binId" TEXT,
  "openingStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "purchaseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sellingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "mrp" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
  "averageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StockMovement" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "type" "MovementType" NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "oldStock" DOUBLE PRECISION NOT NULL,
  "newStock" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reference" TEXT,
  "reason" TEXT,
  "locationNote" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PurchaseRequisition" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PurchaseOrder" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "vendorId" TEXT NOT NULL,
  "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDate" TIMESTAMP(3),
  "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT PRIMARY KEY,
  "poId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rate" DOUBLE PRECISION NOT NULL,
  "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
  "amount" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "PurchaseInvoice" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "poId" TEXT,
  "vendorId" TEXT NOT NULL,
  "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3),
  "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "vendorId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "mode" TEXT,
  "reference" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "VendorLedger" (
  "id" TEXT PRIMARY KEY,
  "vendorId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "narration" TEXT NOT NULL,
  "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Employee" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "userId" TEXT UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "WorkshopJob" (
  "id" TEXT PRIMARY KEY,
  "jobNumber" TEXT NOT NULL UNIQUE,
  "customerId" TEXT,
  "vehicleId" TEXT,
  "complaint" TEXT,
  "status" "WorkshopStatus" NOT NULL DEFAULT 'RECEIVED',
  "advisorId" TEXT,
  "technicianId" TEXT,
  "estimate" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "detail" TEXT,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Setting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SheetSyncLog" (
  "id" TEXT PRIMARY KEY,
  "entity" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---- Foreign keys ---------------------------------------------------------
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_oemBrandId_fkey" FOREIGN KEY ("oemBrandId") REFERENCES "OEMBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rack" ADD CONSTRAINT "Rack_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bin" ADD CONSTRAINT "Bin_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "HSNCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorLedger" ADD CONSTRAINT "VendorLedger_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkshopJob" ADD CONSTRAINT "WorkshopJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkshopJob" ADD CONSTRAINT "WorkshopJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkshopJob" ADD CONSTRAINT "WorkshopJob_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkshopJob" ADD CONSTRAINT "WorkshopJob_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---- Indexes --------------------------------------------------------------
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "Vehicle_chassisNumber_idx" ON "Vehicle"("chassisNumber");
CREATE INDEX "Item_name_idx" ON "Item"("name");
CREATE INDEX "Item_partNumber_idx" ON "Item"("partNumber");
CREATE INDEX "Item_oemNumber_idx" ON "Item"("oemNumber");
CREATE INDEX "StockMovement_itemId_idx" ON "StockMovement"("itemId");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseInvoice_paymentStatus_idx" ON "PurchaseInvoice"("paymentStatus");
CREATE INDEX "VendorLedger_vendorId_idx" ON "VendorLedger"("vendorId");
CREATE INDEX "WorkshopJob_status_idx" ON "WorkshopJob"("status");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "SheetSyncLog_status_idx" ON "SheetSyncLog"("status");

-- ============================================================================
--  SEED DATA
-- ============================================================================

-- Users (password for all: Cmw@2025) -----------------------------------------
INSERT INTO "User" ("id","name","username","email","passwordHash","role") VALUES
  ('usr_admin','Sunil Tiwari','admin','admin@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','ADMIN'),
  ('usr_manager','Operations Manager','manager','manager@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','MANAGER'),
  ('usr_store','Store Manager','store','store@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','STORE_MANAGER'),
  ('usr_accounts','Accounts Executive','accounts','accounts@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','ACCOUNTS'),
  ('usr_purchase','Purchase Officer','purchase','purchase@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','PURCHASE'),
  ('usr_workshop','Workshop Head','workshop','workshop@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','WORKSHOP'),
  ('usr_advisor','Service Advisor','advisor','advisor@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','SERVICE_ADVISOR'),
  ('usr_tech','Lead Technician','tech','tech@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','TECHNICIAN'),
  ('usr_viewer','Read-only User','viewer','viewer@capitalmotorworks.in','$2a$10$wM68hIoPqARhtgROrE7G8O5UPf/Lox.3sDKlZGwM0/idJlcGb3GBi','VIEWER');

-- OEM brands -----------------------------------------------------------------
INSERT INTO "OEMBrand" ("id","name") VALUES
  ('oem_bmw','BMW'), ('oem_merc','Mercedes-Benz'), ('oem_audi','Audi');

-- Vehicle models -------------------------------------------------------------
INSERT INTO "VehicleModel" ("id","name","oemBrandId") VALUES
  ('vm_5series','5 Series G30','oem_bmw'),
  ('vm_eclass','E-Class W213','oem_merc');

-- Category / Unit / HSN ------------------------------------------------------
INSERT INTO "Category" ("id","name") VALUES ('cat_brakes','Brakes'), ('cat_filters','Filters');
INSERT INTO "Unit" ("id","name","symbol") VALUES ('unit_nos','Nos','Nos');
INSERT INTO "HSNCode" ("id","code","gstRate") VALUES ('hsn_8708','87083000',28);

-- Location hierarchy ---------------------------------------------------------
INSERT INTO "Warehouse" ("id","name","address") VALUES ('wh_main','Main Store','Capital Motor Works, Service Bay');
INSERT INTO "Rack" ("id","name","warehouseId") VALUES ('rack_r01','R-01','wh_main');
INSERT INTO "Shelf" ("id","name","rackId") VALUES ('shelf_s01','S-01','rack_r01');
INSERT INTO "Bin" ("id","name","shelfId") VALUES ('bin_b01','B-01','shelf_s01');

-- Vendor ---------------------------------------------------------------------
INSERT INTO "Vendor" ("id","code","name","city","state","gstin","paymentTerms") VALUES
  ('ven_001','VEN-001','Bavaria Auto Spares','Delhi','Delhi','07ABCDE1234F1Z5','Net 30');

-- Sample items ---------------------------------------------------------------
INSERT INTO "Item"
  ("id","sku","name","partNumber","oemNumber","categoryId","unitId","hsnId","vendorId","modelId","warehouseId","rackId","shelfId","binId","currentStock","openingStock","reorderLevel","minStock","maxStock","purchaseRate","sellingRate","mrp","averageCost","gstRate")
VALUES
  ('item_brk1','CMW-BRK-001','Front Brake Pad Set','34116888456','BMW-34116888456','cat_brakes','unit_nos','hsn_8708','ven_001','vm_5series','wh_main','rack_r01','shelf_s01','bin_b01',24,24,8,8,40,4200,6800,7500,4200,28),
  ('item_brk2','CMW-BRK-002','Rear Brake Disc','34216792227','BMW-34216792227','cat_brakes','unit_nos','hsn_8708','ven_001','vm_5series','wh_main','rack_r01','shelf_s01','bin_b01',6,6,6,6,30,5800,8900,9800,5800,28),
  ('item_fil1','CMW-FIL-001','Oil Filter (M-Series)','11428507683','BMW-11428507683','cat_filters','unit_nos','hsn_8708','ven_001','vm_5series','wh_main','rack_r01','shelf_s01','bin_b01',0,0,12,12,60,650,1150,1400,650,28);

-- Company settings -----------------------------------------------------------
INSERT INTO "Setting" ("id","key","value") VALUES
  ('set_company','company','{"name":"Capital Motor Works","founder":"Sunil Tiwari","email":"Connect@systemmaster.in","phone":"+91 90279 65956","website":"www.systemmaster.in"}');

-- Done. Login:  admin / Cmw@2025
