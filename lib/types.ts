export type Activity = {
  id: string;
  name: string;
  slug: string;
};

export type Choice = { value: string; label: string; color: string };

export type FieldType = "number" | "currency" | "choice";

export type ActivityField = {
  id: string;
  activity_id: string;
  key: string;
  label: string;
  unit: string | null;
  field_type: FieldType;
  cost_per_unit: number;
  choices: Choice[] | null;
  sort_order: number;
};

export type Run = {
  id: string;
  activity_id: string;
  run_number: number;
  run_date: string;
  cost: number;
  notes: string | null;
};

export type RunFieldValue = {
  run_id: string;
  field_key: string;
  value_number: number | null;
  value_text: string | null;
};

export const COLOR_OPTIONS: { id: string; label: string }[] = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "red", label: "Red" },
  { id: "amber", label: "Amber" },
  { id: "gray", label: "Gray" },
];
