// Minimal logger interface so callers can plug in their own logging or rely on console.
interface LoadModuleLogger {
  log?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

const defaultLogger: Required<LoadModuleLogger> = {
  log: () => {}, // Debug logging removed for production
  warn: () => {}, // Warnings disabled in production
  error: (...args) => {
    console.error("[optional-module]", ...args);
  },
};

type LoaderOptions = {
  logger?: LoadModuleLogger;
  warnOnceKey?: string;
  warningMessage?: string;
  /**
   * Optional custom loader. Useful when bundlers forbid fully dynamic imports
   * (e.g. Metro) and a platform specific loader must be provided instead.
   */
  loader?: () => unknown | Promise<unknown>;
};

const resolvedModules = new Map<string, unknown>();
const pendingLoads = new Map<string, Promise<unknown | null>>();
const warnedKeys = new Set<string>();

/**
 * Dynamically loads an optional dependency and caches the result. Returns `null`
 * when the module cannot be imported.
 */
export async function loadOptionalModule<T = unknown>(
  moduleName: string,
  options: LoaderOptions = {}
): Promise<T | null> {
  if (resolvedModules.has(moduleName)) {
    return resolvedModules.get(moduleName) as T | null;
  }

  const logger = {
    ...defaultLogger,
    ...(options.logger ?? {}),
  };

  if (!pendingLoads.has(moduleName)) {
    pendingLoads.set(
      moduleName,
      (async () => {
        try {
          const mod = await loadModuleWithFallback(moduleName, options);
          const resolved = (mod as any)?.default ?? mod;
          resolvedModules.set(moduleName, resolved);
          logger.log("Loaded optional module", moduleName);
          return resolved as T;
        } catch (error) {
          logger.log("Optional module unavailable", moduleName, error);
          resolvedModules.set(moduleName, null);
          return null;
        }
      })()
    );
  }

  const loaded = await pendingLoads.get(moduleName)!;
  pendingLoads.delete(moduleName);

  if (!loaded && options.warnOnceKey && !warnedKeys.has(options.warnOnceKey)) {
    warnedKeys.add(options.warnOnceKey);
    logger.warn(options.warningMessage ?? `Module '${moduleName}' not found.`);
  }

  return loaded as T | null;
}

type ModuleLoader = (moduleName: string) => Promise<unknown>;

const dynamicImportLoader: ModuleLoader | null = (() => {
  try {
    return new Function(
      "moduleName",
      "return import(moduleName);"
    ) as ModuleLoader;
  } catch {
    return null;
  }
})();

const dynamicRequire: ((id: string) => unknown) | undefined = (() => {
  try {
    return new Function(
      "return typeof require === 'function' ? require : undefined;"
    )() as ((id: string) => unknown) | undefined;
  } catch {
    return undefined;
  }
})();

async function loadModuleWithFallback(
  moduleName: string,
  options: LoaderOptions
): Promise<unknown> {
  if (options.loader) {
    return await Promise.resolve(options.loader());
  }

  if (dynamicImportLoader) {
    return dynamicImportLoader(moduleName);
  }

  if (dynamicRequire) {
    return dynamicRequire(moduleName);
  }

  throw new Error(
    `No dynamic loader available for optional module '${moduleName}'.`
  );
}

/**
 * Synchronous getter that returns a previously loaded optional module, or `null`
 * if it has either not been loaded yet or failed to load.
 */
export function getCachedOptionalModule<T = unknown>(moduleName: string): T | null {
  if (!resolvedModules.has(moduleName)) {
    return null;
  }
  return resolvedModules.get(moduleName) as T | null;
}
