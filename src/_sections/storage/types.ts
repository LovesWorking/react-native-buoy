import { StorageType } from "../react-query/utils/storageQueryUtils";

export interface StorageKeyInfo {
  key: string;
  value: unknown;
  expectedValue?: string;
  expectedType?: string;
  description?: string;
  storageType: StorageType;
  status:
    | "required_present"
    | "required_missing"
    | "required_wrong_value"
    | "required_wrong_type"
    | "optional_present";
  category: "required" | "optional";
  lastUpdated?: Date;
}

export type RequiredStorageKey =
  | string
  | { key: string; expectedValue: string; description?: string }
  | { key: string; expectedType: string; description?: string }
  | { key: string; storageType: StorageType; description?: string };

export interface StorageKeyStats {
  totalCount: number;
  requiredCount: number;
  missingCount: number;
  wrongValueCount: number;
  wrongTypeCount: number;
  presentRequiredCount: number;
  optionalCount: number;
  // Storage specific stats
  mmkvCount: number;
  asyncCount: number;
  secureCount: number;
}
