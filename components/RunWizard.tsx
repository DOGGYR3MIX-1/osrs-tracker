"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Activity, ActivityField } from "@/lib/types";

type Props = {
  activity: Activity;
  fields: ActivityField[];
  nextRunNumber: number;
  onClose: () => void;
  onSaved: () => void;
};

type CoreStep = { key: string; label: string; kind: "number" | "date" | "choice" };

const OUTCOME_OPTIONS = [
  { v: "T", label: "Teleported out" },
  { v: "S", label: "Survived" },
  { v: "D", label: "Died" },
];

export default function RunWizard({
  activity,
  fields,
  nextRunNumber,
  onClose,
  onSaved,
}: Props) {
  // Steps = the dynamic per-activity fields, then loot value, duration, outcome.
  const steps: CoreStep[] = [
    ...fields.map((f) => ({ key: f.key, label: f.label, kind: "number" as const })),
    { key: "loot_value", label: "Loot value (gp)", kind: "number" },
    { key: "duration_minutes", label: "Duration (minutes)", kind: "number" },
    { key: "outcome", label: "Outcome", kind: "choice" },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function skip() {
    setValue(step.key, step.kind === "choice" ? "S" : "0");
    advance();
  }

  function advance() {
    if (isLast) {
      void save();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function save() {
    setSaving(true);
    setError(null);

    const loot = Number(values["loot_value"] || 0);
    const duration = values["duration_minutes"] ? Number(values["duration_minutes"]) : null;
    const outcome = (values["outcome"] || "S") as "T" | "S" | "D";

    // Auto-calculate cost from field values * cost_per_unit
    let cost = 0;
    const fieldEntries = fields.map((f) => {
      const amount = Number(values[f.key] || 0);
      cost += amount * (f.cost_per_unit || 0);
      return { field_key: f.key, value: amount };
    });

    const { data: run, error: runError } = await supabase
      .from("runs")
      .insert({
        activity_id: activity.id,
        run_number: nextRunNumber,
        loot_value: loot,
        cost,
        duration_minutes: duration,
        outcome,
      })
      .select()
      .single();

    if (runError || !run) {
      setError(runError?.message || "Something went wrong saving the run.");
      setSaving(false);
      return;
    }

    const { error: fieldsError } = await supabase
      .from("run_field_values")
      .insert(fieldEntries.map((f) => ({ run_id: run.id, ...f })));

    if (fieldsError) {
      setError(fieldsError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setDone(true);
    onSaved();
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
          width: 380,
          padding: 24,
        }}
      >
        {!done ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Log a {activity.name} run
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {stepIndex + 1} / {steps.length}
              </span>
            </div>

            <div
              style={{
                height: 4,
                background: "var(--surface-2)",
                borderRadius: 2,
                marginBottom: 24,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((stepIndex + 1) / steps.length) * 100}%`,
                  background: "var(--accent)",
                  transition: "width .2s",
                }}
              />
            </div>

            <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
              {step.label}
            </label>

            {step.kind === "number" && (
              <input
                type="number"
                autoFocus
                value={values[step.key] ?? ""}
                onChange={(e) => setValue(step.key, e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 16,
                }}
              />
            )}

            {step.kind === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setValue("outcome", opt.v)}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border:
                        values["outcome"] === opt.v
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                      background:
                        values["outcome"] === opt.v ? "var(--surface-2)" : "transparent",
                      color: "var(--text)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={skip}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                }}
              >
                Skip
              </button>
              <button
                onClick={advance}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid var(--accent)",
                  background: "var(--accent)",
                  color: "#fff",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : isLast ? "Save run" : "Next"}
              </button>
            </div>

            {stepIndex > 0 && (
              <button
                onClick={back}
                style={{
                  marginTop: 12,
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                ← Back
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 500 }}>Run logged</p>
            <button
              onClick={onClose}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
