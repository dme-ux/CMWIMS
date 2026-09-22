// ============================================================================
//  Salary data helpers — employees (fixed monthly salary) + monthly salary
//  payments (Cash / Bank / UPI), separate from vendor purchase bills and
//  day-to-day operational expenses.
// ============================================================================
import { prisma } from "@/lib/prisma";

export type EmployeeInput = {
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  salary: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM" for the current calendar month. */
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export async function generateEmployeeCode() {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
}

export async function listEmployees(activeOnly = false) {
  return prisma.employee.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createEmployee(input: EmployeeInput) {
  const code = await generateEmployeeCode();
  return prisma.employee.create({
    data: {
      code,
      name: input.name,
      role: input.role,
      phone: input.phone || null,
      email: input.email || null,
      salary: input.salary,
    },
  });
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput> & { isActive?: boolean }) {
  return prisma.employee.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role,
      phone: input.phone,
      email: input.email,
      salary: input.salary,
      isActive: input.isActive,
    },
  });
}

export async function deleteEmployee(id: string) {
  return prisma.employee.delete({ where: { id } });
}

function round(n: number) {
  return Math.round((n || 0) * 100) / 100;
}

function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
}

/**
 * "Generate Salaries" — one click at the start of the month. Creates a
 * PENDING SalaryPayment row for every active employee who doesn't already
 * have one for this month. Full attendance is assumed until "present days"
 * is entered later. Active Advance/EMI installments are auto-deducted once,
 * at generation time (and their remaining balance reduced accordingly).
 * Safe to click more than once — existing rows for the month are untouched.
 */
export async function generateMonthlySalaries(month: string = currentMonth()) {
  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  const existing = await prisma.salaryPayment.findMany({
    where: { month, employeeId: { in: employees.map((e) => e.id) } },
    select: { employeeId: true },
  });
  const already = new Set(existing.map((e) => e.employeeId));
  const toCreate = employees.filter((e) => !already.has(e.id) && e.salary > 0);

  if (toCreate.length === 0) return { created: 0 };

  const totalDays = daysInMonth(month);

  for (const e of toCreate) {
    // active advances/EMIs for this employee, oldest first
    const deductions = await prisma.salaryDeduction.findMany({
      where: { employeeId: e.id, isActive: true, remainingAmount: { gt: 0 } },
      orderBy: { createdAt: "asc" },
    });
    let deductionTotal = 0;
    for (const d of deductions) {
      const installment = Math.min(d.installmentAmount, d.remainingAmount);
      deductionTotal += installment;
      const remainingAmount = round(d.remainingAmount - installment);
      await prisma.salaryDeduction.update({
        where: { id: d.id },
        data: { remainingAmount, isActive: remainingAmount > 0 },
      });
    }
    const grossAmount = e.salary;
    const amount = Math.max(0, round(grossAmount - deductionTotal));
    await prisma.salaryPayment.create({
      data: {
        employeeId: e.id,
        month,
        baseSalary: e.salary,
        totalDays,
        grossAmount,
        deductions: round(deductionTotal),
        amount,
        status: "PENDING",
      },
    });
  }
  return { created: toCreate.length };
}

export type SalaryFilters = { month?: string; employeeId?: string; status?: string };

export async function listSalaryPayments(filters: SalaryFilters = {}) {
  const where: any = {};
  if (filters.month) where.month = filters.month;
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.status) where.status = filters.status;
  return prisma.salaryPayment.findMany({
    where,
    include: { employee: true },
    orderBy: [{ month: "desc" }, { employee: { name: "asc" } }],
    take: 1000,
  });
}

/**
 * Month-end attendance entry — "kitne din present the". Recalculates the
 * prorated gross salary (baseSalary × presentDays / totalDays) and the net
 * payable amount (gross − deductions already applied at generation).
 */
export async function updateAttendance(id: string, presentDays: number, totalDays?: number) {
  const row = await prisma.salaryPayment.findUniqueOrThrow({ where: { id } });
  const days = totalDays ?? row.totalDays ?? daysInMonth(row.month);
  const clampedPresent = Math.max(0, Math.min(presentDays, days));
  const grossAmount = round((row.baseSalary * clampedPresent) / days);
  const amount = Math.max(0, round(grossAmount - row.deductions));
  const status = row.paidAmount >= amount && amount > 0 ? "PAID" : row.paidAmount > 0 ? "PARTIAL" : "PENDING";
  return prisma.salaryPayment.update({
    where: { id },
    data: { presentDays: clampedPresent, totalDays: days, grossAmount, amount, status },
  });
}

/** Record a payment (full or partial) against a salary row — Cash / Bank / UPI. */
export async function paySalary(id: string, amount: number, mode: string, notes?: string) {
  const row = await prisma.salaryPayment.findUniqueOrThrow({ where: { id } });
  const paidAmount = Math.min(row.amount, (row.paidAmount || 0) + amount);
  const status = paidAmount >= row.amount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";
  return prisma.salaryPayment.update({
    where: { id },
    data: { paidAmount, status, mode, notes: notes ?? row.notes, paidAt: new Date() },
  });
}

/** Boss view: per-employee salary ledger for a given month + overall totals. */
export async function getSalaryLedger(month: string = currentMonth()) {
  const rows = await prisma.salaryPayment.findMany({
    where: { month },
    include: { employee: true },
    orderBy: { employee: { name: "asc" } },
  });
  const due = rows.reduce((s, r) => s + r.amount, 0);
  const paid = rows.reduce((s, r) => s + r.paidAmount, 0);
  return {
    month,
    rows,
    due,
    paid,
    pending: due - paid,
  };
}

/** Dashboard card: total salary due this month (across all payment rows generated so far). */
export async function getMonthSalaryTotal(month: string = currentMonth()) {
  const agg = await prisma.salaryPayment.aggregate({
    _sum: { amount: true, paidAmount: true },
    where: { month },
  });
  return {
    due: agg._sum.amount || 0,
    paid: agg._sum.paidAmount || 0,
  };
}

// ---------------------------------------------------------------------------
//  ADVANCE / EMI — money recovered from an employee's salary in installments
// ---------------------------------------------------------------------------

export type DeductionInput = {
  employeeId: string;
  type: "ADVANCE" | "EMI";
  totalAmount: number;
  installmentAmount: number;
  notes?: string | null;
};

export async function createDeduction(input: DeductionInput) {
  return prisma.salaryDeduction.create({
    data: {
      employeeId: input.employeeId,
      type: input.type,
      totalAmount: input.totalAmount,
      installmentAmount: input.installmentAmount,
      remainingAmount: input.totalAmount,
      notes: input.notes || null,
    },
  });
}

export async function listDeductions(employeeId?: string) {
  return prisma.salaryDeduction.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: { employee: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function closeDeduction(id: string) {
  return prisma.salaryDeduction.update({ where: { id }, data: { isActive: false } });
}

export async function deleteDeduction(id: string) {
  return prisma.salaryDeduction.delete({ where: { id } });
}
