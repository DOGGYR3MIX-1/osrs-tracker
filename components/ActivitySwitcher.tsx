"use client";

import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  selectedId: string | null;
  onChange: (id: string) => void;
  onNew: () => void;
};

export default function ActivitySwitcher({ activities, selectedId, onChange, onNew }: Props) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => {
        if (e.target.value === "__new__") {
          onNew();
        } else {
          onChange(e.target.value);
        }
      }}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        color: "var(--text)",
        fontSize: 16,
        fontWeight: 500,
      }}
    >
      {activities.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
      <option value="__new__">+ New activity...</option>
    </select>
  );
}
