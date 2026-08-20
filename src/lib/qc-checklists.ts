export type CheckStatus = "NOT_CHECKED" | "OK" | "NOT_WORKING" | "DAMAGE" | "PASS" | "FAIL" | "ADVISORY" | "REPAIR" | "NA";
export type ChecklistValue = { status: CheckStatus; comment?: string };
export type ChecklistMap = Record<string, ChecklistValue>;
export type ChecklistSection = { title: string; items: { key: string; label: string }[] };

// Job Card receiving checklist is intentionally compact. The detailed delivery
// inspection lives in the separate QC Report module.
export const RECEIVING_CHECKLIST: ChecklistSection[] = [
  { title: "Vehicle Condition", items: [
    { key: "ext_body", label: "Body / dents / scratches" },
    { key: "ext_tyres", label: "Tyres / wheels" },
    { key: "ext_glass", label: "Windshield / mirrors" },
  ]},
  { title: "Working Check", items: [
    { key: "light_front", label: "Front / head lights" },
    { key: "light_rear", label: "Rear / tail lights" },
    { key: "light_indicators", label: "Indicators / hazard" },
    { key: "light_brake_reverse", label: "Brake / reverse lights" },
    { key: "elect_horn", label: "Horn" },
    { key: "ext_wipers", label: "Wiper / washer" },
    { key: "int_ac", label: "A/C / heater" },
    { key: "int_audio", label: "Speaker / audio" },
    { key: "int_windows", label: "Power windows" },
    { key: "int_locks", label: "Central locking" },
    { key: "elect_battery", label: "Battery / warning lights" },
  ]},
];

export const DELIVERY_CHECKLIST: ChecklistSection[] = [
  { title: "Work & Mechanical", items: [
    {key:"del_work",label:"Approved work completed"},
    {key:"del_leaks",label:"No oil / coolant / fluid leakage"},
    {key:"del_warning",label:"No abnormal warning lights"},
    {key:"del_braking",label:"Brakes / parking brake"},
    {key:"del_steering",label:"Steering / alignment"},
    {key:"del_suspension",label:"Suspension / abnormal noise"},
    {key:"del_engine",label:"Engine performance"},
    {key:"del_transmission",label:"Transmission / clutch"},
  ]},
  { title: "Electrical & Comfort", items: [
    {key:"del_low",label:"Headlights low / high beam"},
    {key:"del_indicators",label:"Indicators / hazard"},
    {key:"del_brake",label:"Brake / reverse lights"},
    {key:"del_horn",label:"Horn"},
    {key:"del_wipers",label:"Wipers / washer"},
    {key:"del_ac",label:"A/C / heater"},
    {key:"del_audio",label:"Audio / speakers"},
    {key:"del_windows",label:"Windows / central locking"},
  ]},
  { title: "Delivery", items: [
    {key:"del_roadtest",label:"Road test completed"},
    {key:"del_clean",label:"Interior / exterior cleaned"},
    {key:"del_tools",label:"Jack / tool kit / spare wheel"},
    {key:"del_documents",label:"Documents / keys"},
  ]},
];

export function emptyChecklist(sections: ChecklistSection[]): ChecklistMap {
  const out: ChecklistMap = {};
  sections.forEach(s=>s.items.forEach(i=>out[i.key]={status:"NOT_CHECKED",comment:""}));
  return out;
}
