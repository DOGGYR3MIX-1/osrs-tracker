"use client";

import type { ActivityField, Run, RunFieldValue } from "@/lib/types";

type Props = {
  runs: Run[];
  fields: ActivityField[];
  fieldValues: RunFieldValue[];
};

const OUTCOME_STYLE: Record<string, { bg: string; label: string }> = {
  T: { bg: "var(--blue-bg)", label: "Teleported" },
  S: { bg: "var(--green-bg)", label: "Survived" },
  D: { bg: "var(--red-bg)", label: "Died" },
};

function fmtGp(n: number) {
  return n.toLocaleString();
}

export default function RunsTable({ runs, fields, fieldValues }: Props) {
  if (runs.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", marginTop: 24 }}>
        No runs logged yet. Hit the + button to log your first one.
      </p>
    );
  }

  function valueFor(runId: string, key: string) {
    return fieldValues.find((v) => v.run_id === runId && v.field_key === key)?.value ?? 0;
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
            <th style={{ padding: "8px 12px" }}>Loot (gp)</th>
            <th style={{ padding: "8px 12px" }}>Cost (gp)</th>
            <th style={{ padding: "8px 12px" }}>Profit (gp)</th>
            <th style={{ padding: "8px 12px" }}>Duration</th>
            <th style={{ padding: "8px 12px" }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const style = OUTCOME_STYLE[run.outcome];
            const profit = run.loot_value - run.cost;
            return (
              <tr key={run.id} style={{ background: style.bg }}>
                <td style={{ padding: "8px 12px" }}>{run.run_number}</td>
                <td style={{ padding: "8px 12px" }}>{run.run_date}</td>
                {fields.map((f) => (
                  <td key={f.key} style={{ padding: "8px 12px" }}>
                    {valueFor(run.id, f.key)}
                  </td>
                ))}
                <td style={{ padding: "8px 12px" }}>{fmtGp(run.loot_value)}</td>
                <td style={{ padding: "8px 12px" }}>{fmtGp(run.cost)}</td>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmtGp(profit)}</td>
                <td style={{ padding: "8px 12px" }}>
                  {run.duration_minutes != null ? `${run.duration_minutes}m` : "-"}
                </td>
                <td style={{ padding: "8px 12px" }}>{style.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
