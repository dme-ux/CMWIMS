// ============================================================================
// Master types configuration (client-safe — no Prisma import here).
// ============================================================================
export type MasterField = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "select";
  optionsFrom?: string;
};
export type MasterType = { label: string; fields: MasterField[]; columns: string[] };

export const MASTER_TYPES: Record<string, MasterType> = {
  brand: { label: "Brands", fields: [{ key: "name", label: "Name", required: true }], columns: ["name"] },
  category: { label: "Categories", fields: [{ key: "name", label: "Name", required: true }], columns: ["name"] },
  unit: { label: "Units", fields: [{ key: "name", label: "Name", required: true }, { key: "symbol", label: "Symbol" }], columns: ["name", "symbol"] },
  oem: { label: "OEM Brands", fields: [{ key: "name", label: "Name", required: true }], columns: ["name"] },
  hsn: { label: "HSN Codes", fields: [{ key: "code", label: "Code", required: true }, { key: "gstRate", label: "GST %", type: "number" }], columns: ["code", "gstRate"] },
  warehouse: { label: "Warehouses", fields: [{ key: "name", label: "Name", required: true }, { key: "address", label: "Address" }], columns: ["name", "address"] },
  rack: {
    label: "Racks",
    fields: [{ key: "warehouseId", label: "Warehouse", required: true, type: "select", optionsFrom: "warehouse" }, { key: "name", label: "Rack Number / Name", required: true }],
    columns: ["name", "warehouseName"],
  },
  shelf: {
    label: "Shelves",
    fields: [{ key: "rackId", label: "Rack", required: true, type: "select", optionsFrom: "rack" }, { key: "name", label: "Shelf Number / Name", required: true }],
    columns: ["name", "rackName", "warehouseName"],
  },
  bin: {
    label: "Bins",
    fields: [{ key: "shelfId", label: "Shelf", required: true, type: "select", optionsFrom: "shelf" }, { key: "name", label: "Bin Number / Name", required: true }],
    columns: ["name", "shelfName", "rackName", "warehouseName"],
  },
  vendor: {
    label: "Vendors",
    fields: [{ key: "code", label: "Code", required: true }, { key: "name", label: "Name", required: true }, { key: "phone", label: "Phone" }, { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "gstin", label: "GSTIN" }, { key: "paymentTerms", label: "Payment terms" }],
    columns: ["code", "name", "city", "gstin"],
  },
  customer: {
    label: "Customers",
    fields: [{ key: "code", label: "Code", required: true }, { key: "name", label: "Name", required: true }, { key: "phone", label: "Phone" }, { key: "city", label: "City" }, { key: "gstin", label: "GSTIN" }],
    columns: ["code", "name", "phone", "city"],
  },
};

export const MASTER_ORDER = ["brand", "category", "unit", "oem", "hsn", "warehouse", "rack", "shelf", "bin", "vendor", "customer"];
