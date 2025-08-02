export interface EnvVarInfo {
  key: string;
  value: unknown;
  expectedValue?: string;
  expectedType?: string;
  status:
    | "required_present"
    | "required_missing"
    | "required_wrong_value"
    | "required_wrong_type"
    | "optional_present";
  category: "required" | "optional";
}

export type RequiredEnvVar =
  | string
  | { key: string; expectedValue: string }
  | { key: string; expectedType: string };

export interface EnvVarStats {
  totalCount: number;
  requiredCount: number;
  missingCount: number;
  wrongValueCount: number;
  wrongTypeCount: number;
  presentRequiredCount: number;
  optionalCount: number;
}
