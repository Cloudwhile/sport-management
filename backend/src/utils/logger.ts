import util from "node:util";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const getLogTimezoneOffsetMinutes = () => {
  const rawOffset = process.env["LOG_TIME_OFFSET_MINUTES"];
  if (!rawOffset) return 8 * 60;

  const offset = Number.parseInt(rawOffset, 10);
  return Number.isFinite(offset) ? offset : 8 * 60;
};

const formatTimestamp = () => {
  const offsetMinutes = getLogTimezoneOffsetMinutes();
  const shiftedDate = new Date(Date.now() + offsetMinutes * 60 * 1000);
  return shiftedDate.toISOString().slice(0, 23).replace("T", " ");
};

const inspectOptions = {
  depth: 6,
  colors: false,
  breakLength: Infinity,
  compact: true,
};

const normalizeDetail = (value: unknown): unknown => {
  if (value instanceof Error) {
    return value.stack || value.message;
  }

  return value;
};

const writeLog = (level: LogLevel, details: unknown[]) => {
  const timestamp = formatTimestamp();
  const message =
    details.length > 0
      ? util.formatWithOptions(inspectOptions, ...details.map(normalizeDetail))
      : "";
  process.stdout.write(`${timestamp} [${level}]: ${message}\n`);
};

export const logger = {
  info: (...details: unknown[]) => writeLog("INFO", details),
  warn: (...details: unknown[]) => writeLog("WARN", details),
  error: (...details: unknown[]) => writeLog("ERROR", details),
  debug: (...details: unknown[]) => writeLog("DEBUG", details),
  httpStream: {
    write: (message: string) => writeLog("INFO", [message.trimEnd()]),
  },
};

export const installConsoleLogger = () => {
  console.log = (...details: unknown[]) => logger.info(...details);
  console.info = (...details: unknown[]) => logger.info(...details);
  console.warn = (...details: unknown[]) => logger.warn(...details);
  console.error = (...details: unknown[]) => logger.error(...details);
  console.debug = (...details: unknown[]) => logger.debug(...details);
};
