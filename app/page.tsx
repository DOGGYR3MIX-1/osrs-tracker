"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Activity, ActivityField, Run, RunFieldValue } from "@/lib/types";
import RunWizard from "@/components/RunWizard";
import RunsTable from "@/components/RunsTable";
import ActivitySwitcher from "@/components/ActivitySwitcher";
import NewActivityModal from "@/components/NewActivityModal";

const LAST_ACTIVITY_KEY = "osrs-tracker:last-activity-id";

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fields, setFields] = useState<ActivityField[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [fieldValues, setFieldValues] = useState<RunFieldValue[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const activity = activities.find((a) => a.id === selectedId) || null;

  const loadActivities = useCallback(async () => {
    const { data } = await supabase.from("activities").select("*").order("name");
    setActivities(data || []);

    const remembered =
      typeof window !== "undefined" ? window.localStorage.getItem(LAST_ACTIVITY_KEY) : null;
    const stillExists = data?.some((a) => a.id === remembered);

    if (remembered && stillExists) {
      setSelectedId(remembered);
    } else if (data && data.length > 0) {
      setSelectedId(data[0].id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadRunsForActivity = useCallback(async (activityId: string) => {
    setLoading(true);

    const { data: fieldData } = await supabase
      .from("activity_fields")
      .select("*")
      .eq("activity_id", activityId)
      .order("sort_order");
    setFields(fieldData || []);

    const { data: runData } = await supabase
      .from("runs")
      .select("*")
      .eq("activity_id", activityId)
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
    void loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (selectedId) {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, selectedId);
      void loadRunsForActivity(selectedId);
    }
  }, [selectedId, loadRunsForActivity]);

  const nextRunNumber = runs.length > 0 ? Math.max(...runs.map((r) => r.run_number)) + 1 : 1;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <button
          onClick={() => setWizardOpen(true)}
          aria-label="Log a new run"
          disabled={!activity}
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
            opacity: activity ? 1 : 0.5,
          }}
        >
          +
        </button>

        {activities.length > 0 ? (
          <ActivitySwitcher
            activities={activities}
            selectedId={selectedId}
            onChange={setSelectedId}
            onNew={() => setNewActivityOpen(true)}
          />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            {loading ? "Loading..." : "No activities yet"}
          </h1>
        )}
      </div>

      <p style={{ color: "var(--text-muted)", marginLeft: 56, marginTop: 0 }}>
        {runs.length} run{runs.length === 1 ? "" : "s"} logged
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : activity ? (
        <RunsTable runs={runs} fields={fields} fieldValues={fieldValues} />
      ) : (
        <p style={{ color: "var(--text-muted)", marginTop: 24 }}>
          Use the dropdown above to create your first activity.
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
            void loadRunsForActivity(activity.id);
          }}
        />
      )}

      {newActivityOpen && (
        <NewActivityModal
          onClose={() => setNewActivityOpen(false)}
          onCreated={async (newId) => {
            setNewActivityOpen(false);
            await loadActivities();
            setSelectedId(newId);
          }}
        />
      )}
    </main>
  );
}
