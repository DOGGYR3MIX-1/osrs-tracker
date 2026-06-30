"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Activity, ActivityField, Run, RunFieldValue } from "@/lib/types";
import RunWizard from "@/components/RunWizard";
import RunsTable from "@/components/RunsTable";

export default function Home() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [fields, setFields] = useState<ActivityField[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [fieldValues, setFieldValues] = useState<RunFieldValue[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: activityData } = await supabase
      .from("activities")
      .select("*")
      .eq("slug", "doom")
      .single();

    if (!activityData) {
      setLoading(false);
      return;
    }
    setActivity(activityData);

    const { data: fieldData } = await supabase
      .from("activity_fields")
      .select("*")
      .eq("activity_id", activityData.id)
      .order("sort_order");
    setFields(fieldData || []);

    const { data: runData } = await supabase
      .from("runs")
      .select("*")
      .eq("activity_id", activityData.id)
      .order("run_number", { ascending: false });
    setRuns(runData || []);

    if (runData && runData.length > 0) {
      const { data: valueData } = await supabase
        .from("run_field_values")
        .select("*")
        .in(
          "run_id",
          runData.map((r) => r.id)
        );
      setFieldValues(valueData || []);
    } else {
      setFieldValues([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const nextRunNumber = runs.length > 0 ? Math.max(...runs.map((r) => r.run_number)) + 1 : 1;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <button
          onClick={() => setWizardOpen(true)}
          aria-label="Log a new run"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            fontSize: 22,
            lineHeight: "40px",
            padding: 0,
          }}
        >
          +
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
          {activity ? activity.name : "Loading..."}
        </h1>
      </div>
      <p style={{ color: "var(--text-muted)", marginLeft: 56, marginTop: 0 }}>
        {runs.length} run{runs.length === 1 ? "" : "s"} logged
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : activity ? (
        <RunsTable runs={runs} fields={fields} fieldValues={fieldValues} />
      ) : (
        <p style={{ color: "var(--red)" }}>
          Couldn&apos;t find the Doom activity. Did you run the schema.sql seed data in Supabase?
        </p>
      )}

      {wizardOpen && activity && (
        <RunWizard
          activity={activity}
          fields={fields}
          nextRunNumber={nextRunNumber}
          onClose={() => setWizardOpen(false)}
          onSaved={() => {
            setWizardOpen(false);
            void loadData();
          }}
        />
      )}
    </main>
  );
}
