export type JsonValue = string | number | boolean | null | undefined | JsonValue[] | {
    [key: string]: JsonValue;
} | Date | Error | Map<unknown, unknown> | Set<unknown> | RegExp | ((...args: unknown[]) => unknown) | symbol | bigint | unknown;
export declare function isPlainObject(value: unknown): value is {
    [key: string]: JsonValue;
};
export type Environment = "local" | "dev" | "qa" | "staging" | "prod";
//# sourceMappingURL=types.d.ts.map