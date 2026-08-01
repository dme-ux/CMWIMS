"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; sku: string; currentStock: number };
type Reason = { value: string; label: string };

/** Issue material out of stock. */
export function IssueForm({ items, reasons }: { items: Item[]; reasons: Reason[] }) {
  const router = useRouter();
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState(reasons[0]?.value ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState
