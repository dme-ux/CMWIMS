// ============================================================================
//  Google Sheets Live Sync — server-side client.
//  Call syncToSheet() after any create/update/delete to mirror rows into the
//  connected Google Sheet via the deployed Apps Script Web App.
//  Fire-and-forget: sync failures are logged, never block the main operation.
// ============================================================================
import { prisma } from "@/lib/prisma";

type SyncAction = "CREATE" | "UPDATE" | "DELETE";

export async function syncToSheet(
  entity: string,
  action: SyncAction,
  id: string,
  data?: Record<string, unknown>
) {
  try {
    // read live config from Settings (fallback to env)
    const setting = await prisma.setting.findUnique({ where: { key: "sheetSync" } }).catch(() => null);
    const cfg = setting ? JSON.parse(setting.value) : {};
    const url = cfg.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
    const apiKey = cfg.apiKey || process.env.GOOGLE_SYNC_API_KEY;
    if (!url || !apiKey) return; // sync not configured — silently skip

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, entity, action, id, data }),
    });
    const body = await res.json().catch(() => ({ ok: false }));

    await prisma.sheetSyncLog.create({
      data: {
        entity, action,
        status: body.ok ? "SUCCESS" : "ERROR",
        message: body.ok ? null : String(body.error || "Unknown error"),
      },
    });
  } catch (err) {
    await prisma.sheetSyncLog
      .create({ data: { entity, action, status: "ERROR", message: String(err) } })
      .catch(() => {});
  }
}
