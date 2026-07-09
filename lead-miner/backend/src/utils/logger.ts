type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, msg: string, meta?: unknown) {
  const ts = new Date().toISOString();
  const line = `${ts} [${level.toUpperCase()}] ${msg}`;
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](line, meta);
  } else {
    console[level === 'debug' ? 'log' : level](line);
  }
}

export const logger = {
  info: (m: string, meta?: unknown) => log('info', m, meta),
  warn: (m: string, meta?: unknown) => log('warn', m, meta),
  error: (m: string, meta?: unknown) => log('error', m, meta),
  debug: (m: string, meta?: unknown) =>
    process.env.NODE_ENV !== 'production' && log('debug', m, meta),
};
