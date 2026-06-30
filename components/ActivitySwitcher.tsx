"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  selectedId: string | null;
  onChange: (id: string) => void;
  onNew: () => void;
  onDeleted: () => void;
};

export default function ActivitySwitcher({
  activities,
  selectedId,
  onChange,
  onNew,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const selected = activities.find((a) => a.id === selectedId);

  async function handleDelete() {
    if (!selected) return;
    const confirmed = window.confirm(
      `Delete "${selected.name}" and every run logged under it? This can't be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    await supabase.from("activities").delete().eq("id", selected.id);
    setDeleting(false);
    onDeleted();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

      {selected && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete activity"
          title="Delete this activity"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
          }}
        >
          {deleting ? "..." : "Delete"}
        </button>
      )}
    </div>
  );
}
