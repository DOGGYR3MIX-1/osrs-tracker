export type Activity = {
  id: string;
  name: string;
  slug: string;
};

export type ActivityField = {
  id: string;
  activity_id: string;
  key: string;
  label: string;
  unit: string | null;
  cost_per_unit: number;
  sort_order: number;
};

export type Run = {
  id: string;
  activity_id: string;
  run_number: number;
  run_date: string;
  duration_minutes: number | null;
  loot_value: number;
  cost: number;
  outcome: "T" | "S" | "D";
  notes: string | null;
};

export type RunFieldValue = {
  run_id: string;
  field_key: string;
  value: number;
};
