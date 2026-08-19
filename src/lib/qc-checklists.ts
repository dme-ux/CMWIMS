export type CheckStatus = "NOT_CHECKED" | "OK" | "ADVISORY" | "REPAIR" | "NA";
export type ChecklistValue = { status: CheckStatus; comment?: string };
export type ChecklistMap = Record<string, ChecklistValue>;
export type ChecklistSection = { title: string; items: { key: string; label: string }[] };

export const RECEIVING_CHECKLIST: ChecklistSection[] = [
  { title: "Vehicle Exterior", items: [
    {key:"ext_body",label:"Body panels / paint / dents / scratches"},{key:"ext_leaks",label:"Signs of leaks under vehicle"},{key:"ext_tyres",label:"Tyres condition / visible damage"},{key:"ext_wheels",label:"Wheels / alloys condition"},{key:"ext_glass",label:"Windshield / windows / mirrors"},{key:"ext_doors",label:"Doors / bonnet / boot opening & locking"},{key:"ext_wipers",label:"Wiper blades & washer operation"},
  ]},
  { title: "Lights & Electrical", items: [
    {key:"light_low",label:"Headlights - low beam"},{key:"light_high",label:"Headlights - high beam"},{key:"light_front_ind",label:"Front indicators - left & right"},{key:"light_rear_ind",label:"Rear indicators - left & right"},{key:"light_hazard",label:"Hazard lights"},{key:"light_brake",label:"Brake lights"},{key:"light_reverse",label:"Reverse / backup lights"},{key:"light_fog",label:"Fog lamps"},{key:"light_plate",label:"Registration plate lamps"},{key:"elect_horn",label:"Horn"},{key:"elect_battery",label:"Battery / terminals"},{key:"elect_warning",label:"Dashboard warning lamps"},
  ]},
  { title: "Vehicle Interior & Comfort", items: [
    {key:"int_seatbelt",label:"Seat belts"},{key:"int_ac",label:"A/C cooling / heater operation"},{key:"int_audio",label:"Audio / speakers"},{key:"int_windows",label:"Power windows"},{key:"int_locks",label:"Central locking"},{key:"int_seats",label:"Seats / upholstery condition"},{key:"int_controls",label:"Steering / dashboard controls"},{key:"int_odour",label:"Interior cleanliness / odour"},
  ]},
  { title: "Engine Bay / Fluids", items: [
    {key:"eng_oil",label:"Engine oil level / visible leakage"},{key:"eng_coolant",label:"Coolant level"},{key:"eng_brakefluid",label:"Brake fluid"},{key:"eng_steering",label:"Power steering fluid (if applicable)"},{key:"eng_washer",label:"Windshield washer fluid"},{key:"eng_hoses",label:"Hoses / pipes / visible leaks"},{key:"eng_belts",label:"Belts condition"},
  ]},
  { title: "Brakes / Steering / Suspension", items: [
    {key:"mech_brakes",label:"Brake operation / unusual noise"},{key:"mech_handbrake",label:"Parking brake"},{key:"mech_steering",label:"Steering operation / play"},{key:"mech_suspension",label:"Suspension / shock absorbers"},{key:"mech_bearings",label:"Wheel bearing noise / play"},
  ]},
  { title: "Safety / Accessories Received", items: [
    {key:"acc_jack",label:"Jack set"},{key:"acc_toolkit",label:"Tool kit"},{key:"acc_spare",label:"Spare wheel"},{key:"acc_floormats",label:"Floor mats"},{key:"acc_headrest",label:"Head rests"},{key:"acc_perfume",label:"Perfume / accessory"},{key:"acc_rc",label:"RC / documents received"},{key:"acc_firstaid",label:"First aid kit"},{key:"acc_fire",label:"Fire extinguisher (if equipped)"},
  ]},
];

export const DELIVERY_CHECKLIST: ChecklistSection[] = [
  { title: "Work Completion", items: [
    {key:"del_work",label:"All approved work completed"},{key:"del_parts",label:"Replaced / removed parts accounted for"},{key:"del_leaks",label:"No visible oil / coolant / fluid leakage"},{key:"del_warning",label:"No abnormal warning lights"},{key:"del_levels",label:"All fluid levels checked"},
  ]},
  { title: "Electrical & Lighting Final Check", items: [
    {key:"del_low",label:"Low beam headlights"},{key:"del_high",label:"High beam headlights"},{key:"del_frontind",label:"Front indicators"},{key:"del_rearind",label:"Rear indicators"},{key:"del_hazard",label:"Hazard lights"},{key:"del_brake",label:"Brake lights"},{key:"del_reverse",label:"Reverse lights"},{key:"del_fog",label:"Fog lamps"},{key:"del_horn",label:"Horn"},{key:"del_wipers",label:"Wipers / washer"},
  ]},
  { title: "Road Test / Mechanical", items: [
    {key:"del_braking",label:"Braking performance"},{key:"del_steering",label:"Steering / alignment"},{key:"del_suspension",label:"Suspension / abnormal noise"},{key:"del_engine",label:"Engine performance / idle"},{key:"del_transmission",label:"Transmission / clutch operation"},{key:"del_roadtest",label:"Road test completed"},
  ]},
  { title: "Comfort / Interior / Delivery", items: [
    {key:"del_ac",label:"A/C / heater working"},{key:"del_audio",label:"Audio / speakers working"},{key:"del_windows",label:"Windows / central locking"},{key:"del_clean",label:"Interior / exterior cleaned"},{key:"del_personal",label:"Customer belongings / accessories verified"},{key:"del_tools",label:"Jack / tool kit / spare wheel verified"},{key:"del_documents",label:"Documents / keys verified"},
  ]},
];

export function emptyChecklist(sections: ChecklistSection[]): ChecklistMap {
  const out: ChecklistMap = {};
  sections.forEach(s=>s.items.forEach(i=>out[i.key]={status:"NOT_CHECKED",comment:""}));
  return out;
}
