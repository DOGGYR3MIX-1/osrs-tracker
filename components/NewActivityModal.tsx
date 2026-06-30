"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { COLOR_OPTIONS, type Choice, type FieldType } from "@/lib/types";

type Props = {
  onClose: () => void;
  onCreated: (activityId: string) => void;
};

type DraftField = {
  label: string;
  unit: string;
  fieldType: FieldType;
  choices: Choice[];
};

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

function emptyField(): DraftField {
  return { label: "", unit: "", fieldType: "number", choices: [] };
}

export default function NewActivityModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<DraftField[]>([emptyField()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(i: number, patch: Partial<DraftField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function addFieldRow() {
    setFields((prev) => [...prev, emptyField()]);
  }

  function removeFieldRow(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addChoice(fieldIndex: number) {
    setFields((prev) =>
      prev.map((f, idx) =>
        idx === fieldIndex
          ? { ...f, choices: [...f.choices, { value: "", label: "", color: "blue" }] }
          : f
      )
    );
  }

  function updateChoice(fieldIndex: number, choiceIndex: number, patch: Partial<Choice>) {
    setFields((prev) =>
      prev.map((f, idx) =>
        idx === fieldIndex
          ? {
              ...f,
              choices: f.choices.map((c, ci) => (ci === choiceIndex ? { ...c, ...patch } : c)),
            }
          : f
      )
    );
  }

  function removeChoice(fieldIndex: number, choiceIndex: number) {
    setFields((prev) =>
      prev.map((f, idx) =>
        idx === fieldIndex ? { ...f, choices: f.choices.filter((_, ci) => ci !== choiceIndex) } : f
      )
    );
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
          field_type: f.fieldType,
          cost_per_unit: 0,
          choices:
            f.fieldType === "choice"
              ? f.choices
                  .filter((c) => c.label.trim())
                  .map((c) => ({ ...c, value: c.value.trim() || fieldKey(c.label) }))
              : null,
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

  const inputStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text)",
    fontSize: 14,
  } as const;

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
          width: 480,
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
          style={{ ...inputStyle, width: "100%", padding: "10px 12px", fontSize: 16, marginBottom: 20 }}
        />

        <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          Fields
        </label>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Run # and date are automatic. Add everything else here - loot value,
          supplies, depth, even an outcome/status field with its own colors.
        </p>

        {fields.map((f, i) => (
          <div
            key={i}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Field name, e.g. Loot value"
                style={{ ...inputStyle, flex: 2 }}
              />
              <select
                value={f.fieldType}
                onChange={(e) => updateField(i, { fieldType: e.target.value as FieldType })}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="number">Number</option>
                <option value="currency">Currency (gp)</option>
                <option value="choice">Choice (colored status)</option>
              </select>
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

            {f.fieldType !== "choice" && (
              <input
                value={f.unit}
                onChange={(e) => updateField(i, { unit: e.target.value })}
                placeholder="Unit (optional), e.g. arrows, sips, depth"
                style={{ ...inputStyle, width: "100%" }}
              />
            )}

            {f.fieldType === "choice" && (
              <div>
                {f.choices.map((c, ci) => (
                  <div key={ci} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <input
                      value={c.label}
                      onChange={(e) => updateChoice(i, ci, { label: e.target.value })}
                      placeholder="Label, e.g. Survived"
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <select
                      value={c.color}
                      onChange={(e) => updateChoice(i, ci, { color: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      {COLOR_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeChoice(i, ci)}
                      aria-label="Remove option"
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
                  onClick={() => addChoice(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 13,
                    padding: "4px 0",
                  }}
                >
                  + Add option
                </button>
              </div>
            )}
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
