import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth/session";
import {canSession} from "@/lib/auth/rbac";
import SettingsClient from "@/components/settings/settings-client";
export const dynamic="force-dynamic";
export default async function SettingsPage(){const s=await getSession();if(!s||!canSession(s,"settings.manage"))redirect("/dashboard");return <SettingsClient/>}
