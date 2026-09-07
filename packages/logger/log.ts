type LogData = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

export interface Logger {
  child: (context: LogData) => Logger;
  debug: (message: string, data?: LogData) => void;
  error: (message: string, data?: LogData) => void;
  info: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
}

function bind(context: LogData): Logger {
  const emit = (level: Level) => (message: string, data?: LogData) => {
    if (level === "debug" && process.env.NODE_ENV === "production") {
      return;
    }
    const merged = { ...context, ...data };
    if (Object.keys(merged).length === 0) {
      console[level](message);
      return;
    }
    console[level](message, merged);
  };

  return {
    debug: emit("debug"),
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    child: (extra) => bind({ ...context, ...extra }),
  };
}

export const logger = bind({});

export function createRequestLogger(context: LogData): Logger {
  return bind(
    Object.fromEntries(
      Object.entries(context).filter(([, value]) => value != null)
    )
  );
}
