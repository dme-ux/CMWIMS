"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, XCircle, ThumbsDown } from "lucide-react";

/** Status-transition buttons on the PO detail page. */
export function POActions({ id, status, canManage, canApprove }: { id: string; status: string; canManage: boolean; canApprove: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: string) {
    if (action === "reject" && !confirm("Reject this purchase order?")) return;
    if (action === "cancel" && !confirm("Cancel this purchase order?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Action failed."); setBusy(false); return; }
    router.refresh();
    setBusy(false);
  }

  const isOpen = ["DRAFT", "PENDING_APPROVAL"].includes(status);
  const canSubmit = canManage && status === "DRAFT";
  const canApproveNow = canApprove && isOpen;
  const canReject = canApprove && isOpen;
  const canSend = canManage && status === "APPROVED";
  const canCancel = canManage && !["RECEIVED", "CANCELLED"].includes(status);

  if (!canSubmit && !canApproveNow && !canReject && !canSend && !canCancel) return null;

  return (
    <div className="space-y-2">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {canSubmit && <Button variant="outline" onClick={() => act("submit")} loading={busy}><Send className="h-4 w-4" /> Submit for approval</Button>}
        {canApproveNow && <Button onClick={() => act("approve")} loading={busy}><CheckCircle2 className="h-4 w-4" /> Approve</Button>}
        {canReject && <Button variant="outline" onClick={() => act("reject")} loading={busy} className="border-red-200 text-red-600 hover:bg-red-50"><ThumbsDown className="h-4 w-4" /> Reject</Button>}
        {canSend && <Button onClick={() => act("send")} loading={busy}><Send className="h-4 w-4" /> Mark as sent</Button>}
        {canCancel && !isOpen && <Button variant="ghost" onClick={() => act("cancel")} loading={busy} className="text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" /> Cancel</Button>}
      </div>
    </div>
  );
}
