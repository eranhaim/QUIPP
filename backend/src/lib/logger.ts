type LogLevel = 'info' | 'warn' | 'error';

function sanitizeMessage(message: string): string {
  return message
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, '$1[redacted]@')
    .replace(/(waInstance\d+\/[^/\s]+\/)[^/\s]+/gi, '$1[redacted]')
    .slice(0, 1_000);
}

function safeMeta(meta: unknown): unknown {
  if (meta instanceof Error) {
    const coded = meta as Error & { code?: unknown };
    return {
      errorName: meta.name,
      errorMessage: sanitizeMessage(meta.message),
      ...(coded.code === undefined ? {} : { errorCode: coded.code }),
    };
  }
  return meta;
}

function write(level: LogLevel, event: string, meta?: unknown): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(meta === undefined ? {} : { context: safeMeta(meta) }),
  });
  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  info: (event: string, meta?: unknown) => write('info', event, meta),
  warn: (event: string, meta?: unknown) => write('warn', event, meta),
  error: (event: string, meta?: unknown) => write('error', event, meta),
};
