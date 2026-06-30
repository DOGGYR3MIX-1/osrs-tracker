"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  onClose: () => void;
  onCreated: (activityId: string) => void;
};

type DraftField = { label: string; unit: string };

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fieldKey(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

export default function NewActivityModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<DraftField[]>([{ label: "", unit: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(i: number, patch: Partial<DraftField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function addFieldRow() {
    setFields((prev) => [...prev, { label: "", unit: "" }]);
  }

  function removeFieldRow(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!name.trim()) {
      setError("Give the activity a name first.");
      return;
    }
    setSaving(true);
    setError(null);

    const slug = slugify(name);

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({ name: name.trim(), slug })
      .select()
      .single();

    if (activityError || !activity) {
      setError(activityError?.message || "Couldn't create the activity.");
      setSaving(false);
      return;
    }

    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length > 0) {
      const { error: fieldsError } = await supabase.from("activity_fields").insert(
        validFields.map((f, idx) => ({
          activity_id: activity.id,
          key: fieldKey(f.label),
          label: f.label.trim(),
          unit: f.unit.trim() || null,
          cost_per_unit: 0,
          sort_order: idx + 1,
        }))
      );
      if (fieldsError) {
        setError(fieldsError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onCreated(activity.id);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          width: 420,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 24,
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
          New activity
        </p>
        <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tombs of Amascut"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            fontSize: 16,
            marginBottom: 20,
          }}
        />

        <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          Tracked fields
        </label>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Anything besides loot value, duration and outcome — these always get added
          automatically. E.g. "Raid level", "Supplies used".
        </p>

        {fields.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={f.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
              placeholder="Field name, e.g. Raid level"
              style={{
                flex: 2,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 14,
              }}
            />
            <input
              value={f.unit}
              onChange={(e) => updateField(i, { unit: e.target.value })}
              placeholder="Unit (optional)"
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 14,
              }}
            />
            <button
              onClick={() => removeFieldRow(i)}
              aria-label="Remove field"
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                borderRadius: 8,
                width: 36,
              }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={addFieldRow}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: 13,
            padding: "4px 0",
            marginBottom: 20,
          }}
        >
          + Add another field
        </button>

        {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Creating..." : "Create activity"}
          </button>
        </div>
      </div>
    </div>
  );
}
