import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getGatePasses } from "@/lib/gatepass";
import { GatePassClient } from "@/components/gatepass/gatepass-client";

export const dynamic = "force-dynamic";

export default async function GatePassPage() {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) redirect("/dashboard");

  const [passes, companySetting] = await Promise.all([
    getGatePasses(),
    prisma.setting.findUnique({ where: { key: "company" } }).catch(() => null),
  ]);
  const company = companySetting ? JSON.parse(companySetting.value) : {};

  const passesData = passes.map((p) => ({
    id: p.id, number: p.number, date: p.date.toISOString(), partyName: p.partyName,
    vehicleNo: p.vehicleNo, purpose: p.purpose, authorisedBy: p.authorisedBy,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Gate Pass</h1>
        <p className="text-sm text-ink-muted">Generate and print vehicle delivery gate passes.</p>
      </div>
      <GatePassClient passes={passesData} company={company} />
    </div>
  );
}
