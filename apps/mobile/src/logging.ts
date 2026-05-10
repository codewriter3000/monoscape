export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type MobileLogEntry = {
  level: LogLevel;
  scope?: string;
  message: string;
  context: unknown[];
  timestamp: string;
};

type MobileLogListener = (entry: MobileLogEntry) => void;

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

const LOG_LEVEL_STORAGE_KEY = "monoscape.mobile.logLevel";
const LOG_LEVEL_QUERY_KEY = "logLevel";
const DEFAULT_LOG_LEVEL: LogLevel = "INFO";
const subscribers = new Set<MobileLogListener>();

let activeLogLevel: LogLevel = DEFAULT_LOG_LEVEL;
let activeLogPriority = LOG_LEVELS[activeLogLevel];

function normalizeLogLevel(value?: string | null): LogLevel | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized in LOG_LEVELS) {
    return normalized as LogLevel;
  }

  return null;
}

function resolveInitialLogLevel(): LogLevel {
  if (typeof window === "undefined") {
    return DEFAULT_LOG_LEVEL;
  }

  const queryLevel = normalizeLogLevel(
    new URLSearchParams(window.location.search).get(LOG_LEVEL_QUERY_KEY)
  );
  if (queryLevel) {
    return queryLevel;
  }

  const storedLevel = normalizeLogLevel(window.localStorage.getItem(LOG_LEVEL_STORAGE_KEY));
  if (storedLevel) {
    return storedLevel;
  }

  const envLevel = normalizeLogLevel(
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_MOBILE_LOG_LEVEL
  );
  if (envLevel) {
    return envLevel;
  }

  return DEFAULT_LOG_LEVEL;
}

function syncLogLevel(level: LogLevel) {
  activeLogLevel = level;
  activeLogPriority = LOG_LEVELS[level];
}

function shouldLog(level: LogLevel) {
  return LOG_LEVELS[level] >= activeLogPriority;
}

function formatPrefix(level: LogLevel, scope?: string) {
  const base = `[Mobile][${level}]`;
  return scope ? `${base}[${scope}]` : base;
}

function emit(entry: MobileLogEntry) {
  subscribers.forEach((listener) => listener(entry));
}

function writeLog(level: LogLevel, scope: string | undefined, message: string, context: unknown[]) {
  if (!shouldLog(level)) {
    return;
  }

  const prefix = formatPrefix(level, scope);
  const timestamp = new Date().toISOString();
  const entry: MobileLogEntry = {
    level,
    scope,
    message,
    context,
    timestamp
  };

  switch (level) {
    case "DEBUG":
      console.debug(prefix, message, ...context);
      break;
    case "INFO":
      console.info(prefix, message, ...context);
      break;
    case "WARN":
      console.warn(prefix, message, ...context);
      break;
    case "ERROR":
      console.error(prefix, message, ...context);
      break;
    default:
      console.log(prefix, message, ...context);
      break;
  }

  emit(entry);
}

export function setMobileLogLevel(level: LogLevel) {
  syncLogLevel(level);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOG_LEVEL_STORAGE_KEY, level);
  }
}

export function getMobileLogLevel(): LogLevel {
  return activeLogLevel;
}

export function onMobileLog(listener: MobileLogListener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function createMobileLogger(scope?: string) {
  return {
    debug: (message: string, ...context: unknown[]) => writeLog("DEBUG", scope, message, context),
    info: (message: string, ...context: unknown[]) => writeLog("INFO", scope, message, context),
    warn: (message: string, ...context: unknown[]) => writeLog("WARN", scope, message, context),
    error: (message: string, ...context: unknown[]) => writeLog("ERROR", scope, message, context)
  };
}

export function initializeMobileLogging() {
  const initialLevel = resolveInitialLogLevel();
  syncLogLevel(initialLevel);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOG_LEVEL_STORAGE_KEY, initialLevel);
    (window as typeof window & {
      MonoscapeMobileLogging?: {
        getLevel: () => LogLevel;
        setLevel: (level: LogLevel) => void;
        levels: LogLevel[];
        subscribe: (listener: MobileLogListener) => () => void;
      };
    }).MonoscapeMobileLogging = {
      getLevel: getMobileLogLevel,
      setLevel: setMobileLogLevel,
      levels: Object.keys(LOG_LEVELS) as LogLevel[],
      subscribe: onMobileLog
    };
  }

  const logger = createMobileLogger("Logging");
  logger.info("Mobile logging initialized.", { level: initialLevel });

  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      logger.error("Unhandled window error.", event.error ?? event.message);
    });

    window.addEventListener("unhandledrejection", (event) => {
      logger.error("Unhandled promise rejection.", event.reason);
    });
  }
}
