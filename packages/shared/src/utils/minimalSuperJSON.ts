/**
 * Minimal SuperJSON implementation for DevTools
 * Handles serialization/deserialization of special JavaScript types
 * Zero dependencies, ~250 LOC
 *
 * Supports: Date, RegExp, Set, Map, Error, BigInt, undefined, NaN, Infinity, -0, URL, TypedArrays
 */

// ============================================================================
// Type Guards
// ============================================================================

const isUndefined = (payload: any): payload is undefined =>
  typeof payload === 'undefined';

const isPlainObject = (payload: any): payload is Record<string, any> => {
  if (typeof payload !== 'object' || payload === null) return false;
  if (payload === Object.prototype) return false;
  if (Object.getPrototypeOf(payload) === null) return true;
  return Object.getPrototypeOf(payload) === Object.prototype;
};

const isArray = (payload: any): payload is any[] => Array.isArray(payload);

const isPrimitive = (payload: any): payload is boolean | null | undefined | number | string | symbol =>
  typeof payload === 'boolean' ||
  payload === null ||
  typeof payload === 'undefined' ||
  typeof payload === 'number' ||
  typeof payload === 'string' ||
  typeof payload === 'symbol';

const isDate = (payload: any): payload is Date =>
  payload instanceof Date && !isNaN(payload.valueOf());

const isError = (payload: any): payload is Error =>
  payload instanceof Error;

const isRegExp = (payload: any): payload is RegExp =>
  payload instanceof RegExp;

const isSet = (payload: any): payload is Set<any> =>
  payload instanceof Set;

const isMap = (payload: any): payload is Map<any, any> =>
  payload instanceof Map;

const isBigint = (payload: any): payload is bigint =>
  typeof payload === 'bigint';

const isNaNValue = (payload: any): payload is typeof NaN =>
  typeof payload === 'number' && isNaN(payload);

const isInfinite = (payload: any): payload is number =>
  payload === Infinity || payload === -Infinity;

const isMinusZero = (payload: any): payload is number =>
  payload === 0 && 1 / payload === -Infinity;

const isURL = (payload: any): payload is URL =>
  payload instanceof URL;

const isTypedArray = (payload: any): payload is TypedArray =>
  ArrayBuffer.isView(payload) && !(payload instanceof DataView);

type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | Uint8ClampedArray;

// ============================================================================
// Type Transformations
// ============================================================================

type TypeAnnotation =
  | 'undefined'
  | 'bigint'
  | 'Date'
  | 'Error'
  | 'regexp'
  | 'set'
  | 'map'
  | 'number'
  | 'URL'
  | ['typed-array', string];

interface TransformRule<T = any> {
  isApplicable: (v: any) => boolean;
  annotation: TypeAnnotation | ((v: any) => TypeAnnotation);
  transform: (v: T) => any;
  untransform: (v: any, annotation?: TypeAnnotation) => T;
}

const TYPED_ARRAY_CONSTRUCTORS: Record<string, any> = {
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  Uint8ClampedArray,
};

const transformRules: TransformRule[] = [
  {
    isApplicable: isUndefined,
    annotation: 'undefined',
    transform: () => null,
    untransform: () => undefined,
  },
  {
    isApplicable: isBigint,
    annotation: 'bigint',
    transform: (v: bigint) => v.toString(),
    untransform: (v: string) => {
      if (typeof BigInt !== 'undefined') {
        return BigInt(v);
      }
      console.error('BigInt is not supported in this environment');
      return v as any;
    },
  },
  {
    isApplicable: isDate,
    annotation: 'Date',
    transform: (v: Date) => v.toISOString(),
    untransform: (v: string) => new Date(v),
  },
  {
    isApplicable: isError,
    annotation: 'Error',
    transform: (v: Error) => ({
      name: v.name,
      message: v.message,
      stack: v.stack,
      cause: 'cause' in v ? (v as any).cause : undefined,
    }),
    untransform: (v: any) => {
      const e = new Error(v.message);
      e.name = v.name;
      e.stack = v.stack;
      if (v.cause !== undefined) {
        (e as any).cause = v.cause;
      }
      return e;
    },
  },
  {
    isApplicable: isRegExp,
    annotation: 'regexp',
    transform: (v: RegExp) => '' + v,
    untransform: (v: string) => {
      const body = v.slice(1, v.lastIndexOf('/'));
      const flags = v.slice(v.lastIndexOf('/') + 1);
      return new RegExp(body, flags);
    },
  },
  {
    isApplicable: isSet,
    annotation: 'set',
    transform: (v: Set<any>) => [...v.values()],
    untransform: (v: any[]) => new Set(v),
  },
  {
    isApplicable: isMap,
    annotation: 'map',
    transform: (v: Map<any, any>) => [...v.entries()],
    untransform: (v: any[]) => new Map(v),
  },
  {
    isApplicable: (v) => isNaNValue(v) || isInfinite(v),
    annotation: 'number',
    transform: (v: number) => {
      if (isNaNValue(v)) return 'NaN';
      return v > 0 ? 'Infinity' : '-Infinity';
    },
    untransform: (v: string) => Number(v),
  },
  {
    isApplicable: isMinusZero,
    annotation: 'number',
    transform: () => '-0',
    untransform: () => -0,
  },
  {
    isApplicable: isURL,
    annotation: 'URL',
    transform: (v: URL) => v.toString(),
    untransform: (v: string) => new URL(v),
  },
  {
    isApplicable: isTypedArray,
    annotation: (v: TypedArray) => ['typed-array', v.constructor.name],
    transform: (v: TypedArray) => [...v],
    untransform: (v: any[], annotation: any) => {
      const typeName = Array.isArray(annotation) ? annotation[1] : 'Uint8Array';
      const ctor = TYPED_ARRAY_CONSTRUCTORS[typeName];
      if (!ctor) {
        throw new Error(`Unknown typed array: ${typeName}`);
      }
      return new ctor(v);
    },
  },
];

// ============================================================================
// Serialization Walker
// ============================================================================

interface WalkerResult {
  transformedValue: any;
  annotations?: Record<string, TypeAnnotation>;
}

function transformValue(value: any): { value: any; type: TypeAnnotation } | undefined {
  for (const rule of transformRules) {
    if (rule.isApplicable(value)) {
      const annotation = typeof rule.annotation === 'function'
        ? rule.annotation(value)
        : rule.annotation;
      return {
        value: rule.transform(value),
        type: annotation,
      };
    }
  }
  return undefined;
}

function untransformValue(json: any, type: TypeAnnotation): any {
  for (const rule of transformRules) {
    const ruleAnnotation = typeof rule.annotation === 'function'
      ? (Array.isArray(type) ? type[0] : type)
      : rule.annotation;

    const matches = Array.isArray(type) && Array.isArray(ruleAnnotation)
      ? type[0] === ruleAnnotation[0]
      : ruleAnnotation === type;

    if (matches) {
      return rule.untransform(json, type);
    }
  }
  throw new Error(`Unknown transformation: ${type}`);
}

const isDeep = (object: any): boolean =>
  isPlainObject(object) || isArray(object) || isMap(object) || isSet(object) || isError(object);

function escapeKey(key: string): string {
  return key.replace(/\\/g, '\\\\').replace(/\./g, '\\.');
}

function walker(
  object: any,
  path: (string | number)[] = [],
  objectsInThisPath: any[] = []
): WalkerResult {
  const primitive = isPrimitive(object);

  // Check for circular references
  if (!primitive && !isDeep(object)) {
    const transformed = transformValue(object);
    return transformed
      ? {
          transformedValue: transformed.value,
          annotations: { [path.map(String).map(escapeKey).join('.')]: transformed.type },
        }
      : { transformedValue: object };
  }

  if (!primitive && objectsInThisPath.indexOf(object) !== -1) {
    // Circular reference detected
    return { transformedValue: null };
  }

  if (!isDeep(object)) {
    const transformed = transformValue(object);
    return transformed
      ? {
          transformedValue: transformed.value,
          annotations: path.length > 0
            ? { [path.map(String).map(escapeKey).join('.')]: transformed.type }
            : { '': transformed.type },
        }
      : { transformedValue: object };
  }

  const transformationResult = transformValue(object);
  const transformed = transformationResult?.value ?? object;

  const transformedValue: any = isArray(transformed) ? [] : {};
  const allAnnotations: Record<string, TypeAnnotation> = {};

  // Add annotation for the object itself if it was transformed
  if (transformationResult) {
    const key = path.length > 0 ? path.map(String).map(escapeKey).join('.') : '';
    allAnnotations[key] = transformationResult.type;
  }

  // Iterate over object/array properties
  const entries = isArray(transformed)
    ? transformed.map((v, i) => [i, v] as const)
    : Object.entries(transformed);

  for (const [index, value] of entries) {
    const indexStr = String(index);

    // Prototype pollution prevention
    if (indexStr === '__proto__' || indexStr === 'constructor' || indexStr === 'prototype') {
      throw new Error(
        `Detected property ${indexStr}. This is a prototype pollution risk, please remove it from your object.`
      );
    }

    const recursiveResult = walker(
      value,
      [...path, index],
      [...objectsInThisPath, object]
    );

    transformedValue[index] = recursiveResult.transformedValue;

    if (recursiveResult.annotations) {
      Object.assign(allAnnotations, recursiveResult.annotations);
    }
  }

  return {
    transformedValue,
    annotations: Object.keys(allAnnotations).length > 0 ? allAnnotations : undefined,
  };
}

// ============================================================================
// Deep Access Utilities
// ============================================================================

function parsePath(pathString: string): (string | number)[] {
  if (pathString === '') return [];

  const result: (string | number)[] = [];
  let segment = '';

  for (let i = 0; i < pathString.length; i++) {
    const char = pathString.charAt(i);

    if (char === '\\') {
      const nextChar = pathString.charAt(i + 1);
      if (nextChar === '\\') {
        segment += '\\';
        i++;
        continue;
      } else if (nextChar === '.') {
        segment += '.';
        i++;
        continue;
      }
    }

    if (char === '.') {
      result.push(segment);
      segment = '';
      continue;
    }

    segment += char;
  }

  if (segment) {
    result.push(segment);
  }

  return result;
}

function setDeep(object: any, path: (string | number)[], value: any): void {
  if (path.length === 0) {
    return;
  }

  let current = object;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }

  current[path[path.length - 1]] = value;
}

function getDeep(object: any, path: (string | number)[]): any {
  let current = object;
  for (const key of path) {
    current = current[key];
  }
  return current;
}

// ============================================================================
// Public API
// ============================================================================

export interface SuperJSONResult {
  json: any;
  meta?: {
    values?: Record<string, TypeAnnotation>;
  };
}

export function serialize(object: any): SuperJSONResult {
  const result = walker(object);

  const res: SuperJSONResult = {
    json: result.transformedValue,
  };

  if (result.annotations) {
    res.meta = { values: result.annotations };
  }

  return res;
}

export function deserialize<T = unknown>(payload: SuperJSONResult): T {
  const { json, meta } = payload;

  if (!meta?.values) {
    return json;
  }

  // Create a shallow copy to avoid mutating the input
  let result = isArray(json) ? [...json] : { ...json };

  // Apply transformations
  for (const [pathString, type] of Object.entries(meta.values)) {
    const path = parsePath(pathString);

    if (path.length === 0) {
      // Root level transformation
      result = untransformValue(result, type);
    } else {
      const value = getDeep(result, path);
      const transformed = untransformValue(value, type);
      setDeep(result, path, transformed);
    }
  }

  return result as T;
}
