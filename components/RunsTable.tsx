"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ActivityField, Run, RunFieldValue } from "@/lib/types";

type Props = {
  runs: Run[];
  fields: ActivityField[];
  fieldValues: RunFieldValue[];
  onDeleted: () => void;
};

function fmtGp(n: number) {
  return n.toLocaleString();
}

export default function RunsTable({ runs, fields, fieldValues, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", marginTop: 24 }}>
        No runs logged yet. Hit the + button to log your first one.
      </p>
    );
  }

  function rawValue(runId: string, key: string) {
    return fieldValues.find((v) => v.run_id === runId && v.field_key === key);
  }

  // Row color comes from the first 'choice' type field defined for this activity, if any.
  const colorField = fields.find((f) => f.field_type === "choice");

  function rowBg(runId: string) {
    if (!colorField) return undefined;
    const val = rawValue(runId, colorField.key)?.value_text;
    const choice = colorField.choices?.find((c) => c.value === val);
    return choice ? `var(--${choice.color}-bg)` : undefined;
  }

  function displayValue(runId: string, field: ActivityField) {
    const v = rawValue(runId, field.key);
    if (!v) return "-";
    if (field.field_type === "choice") {
      return field.choices?.find((c) => c.value === v.value_text)?.label || v.value_text || "-";
    }
    if (field.field_type === "currency") {
      return v.value_number != null ? fmtGp(v.value_number) : "-";
    }
    return v.value_number ?? "-";
  }

  async function handleDelete(runId: string) {
    if (!window.confirm("Delete this run? This can't be undone.")) return;
    setDeletingId(runId);
    await supabase.from("runs").delete().eq("id", runId);
    setDeletingId(null);
    onDeleted();
  }

  return (
    <div style={{ overflowX: "auto", marginTop: 24 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
            <th style={{ padding: "8px 12px" }}>#</th>
            <th style={{ padding: "8px 12px" }}>Date</th>
            {fields.map((f) => (
              <th key={f.key} style={{ padding: "8px 12px" }}>
                {f.label}
              </th>
            ))}
            <th style={{ padding: "8px 12px" }}>Cost (gp)</th>
            <th style={{ padding: "8px 12px" }}></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} style={{ background: rowBg(run.id) }}>
              <td style={{ padding: "8px 12px" }}>{run.run_number}</td>
              <td style={{ padding: "8px 12px" }}>{run.run_date}</td>
              {fields.map((f) => (
                <td key={f.key} style={{ padding: "8px 12px" }}>
                  {displayValue(run.id, f)}
                </td>
              ))}
              <td style={{ padding: "8px 12px" }}>{fmtGp(run.cost)}</td>
              <td style={{ padding: "8px 12px" }}>
                <button
                  onClick={() => handleDelete(run.id)}
                  disabled={deletingId === run.id}
                  aria-label="Delete run"
                  style={{
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 13,
                  }}
                >
                  {deletingId === run.id ? "..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
