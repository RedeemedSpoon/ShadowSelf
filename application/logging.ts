import process from 'node:process';

const {stripVTControlCharacters} = process.getBuiltinModule('node:util');

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

interface FailureDetails {
  code?: string;
  name?: string;
  message?: string;
  address?: string;
  port?: number;
  status?: number;
  statusCode?: number;
  cause?: unknown;
}

const colors = {info: 36, success: 32, warn: 33, error: 31};
const reasons: Record<string, string> = {
  ECONNREFUSED: 'Connection refused',
  ECONNRESET: 'Connection reset by the remote service',
  ETIMEDOUT: 'Connection timed out',
  ENOTFOUND: 'Host not found',
  EAI_AGAIN: 'DNS lookup failed temporarily',
  ENETUNREACH: 'Network unreachable',
  EHOSTUNREACH: 'Host unreachable',
  EADDRINUSE: 'Address already in use',
  '28P01': 'Database authentication failed',
  '3D000': 'Database does not exist',
  '42P01': 'Database table is missing; initialize the schema',
  '42703': 'Database column is missing; check the schema',
  '53300': 'Database connection limit reached',
  '23505': 'Database record already exists',
  '23503': 'Database reference does not exist',
  '08006': 'Database connection failed',
};

function cleanMessage(message: string) {
  let text = stripVTControlCharacters(message).replace(/[\p{Cc}\p{Cf}]/gu, ' ');

  for (const [name, value] of Object.entries(process.env)) {
    if (value && value.length >= 8 && /key|password|token|secret|sauce/i.test(name)) {
      text = text.replaceAll(value, '[redacted]');
    }
  }

  return text
    .replace(/https?:\/\/[^\s)]+/g, (value) => {
      try {
        return new URL(value).origin;
      } catch {
        return '[URL]';
      }
    })
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\bss_(?:session|api)_[\w-]+/g, '[redacted]')
    .replace(
      /((?:password|passwd|secret|api[_-]?key|access[_-]?token)\b["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^,\s;}]+)/gi,
      '$1[redacted]',
    )
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\s+/g, ' ')
    .trim();
}

export function failureMessage(failure: unknown): string {
  let current = failure;

  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const details = current as FailureDetails;

    if (details.code && Object.hasOwn(reasons, details.code)) {
      const address = details.address && /^[\w.:[\]-]+$/.test(details.address) ? details.address : '';
      const port = Number.isSafeInteger(details.port) && details.port! > 0 ? details.port : '';
      const host = address.includes(':') ? `[${address}]` : address;
      const target = address ? `${host}${port ? `:${port}` : ''}` : port ? `port ${port}` : '';

      return `${reasons[details.code]}${target ? ` at ${target}` : ''}`;
    }

    if (details.code && /^[0-9A-Z]{5}$/.test(details.code)) {
      return `Database error ${details.code}`;
    }

    if (!details.cause) {
      break;
    }

    current = details.cause;
  }

  const details = failure as FailureDetails | null;
  const status = details?.status ?? details?.statusCode;
  const prefix = typeof status === 'number' && status >= 400 && status < 600 ? `HTTP ${status}: ` : '';
  const message =
    details?.name === 'AbortError'
      ? 'Operation cancelled'
      : details?.name === 'TimeoutError'
        ? 'Request timed out'
        : typeof details?.message === 'string'
          ? details.message
          : typeof failure === 'string'
            ? failure
            : 'Unexpected failure';

  return `${prefix}${cleanMessage(message).slice(0, 240)}`;
}

export function log(level: LogLevel, message: string) {
  const stream = level === 'warn' || level === 'error' ? process.stderr : process.stdout;
  const color =
    process.env.NO_COLOR === undefined &&
    process.env.FORCE_COLOR !== '0' &&
    (process.env.FORCE_COLOR !== undefined || stream.isTTY);
  const time = new Date().toTimeString().slice(0, 8);
  const label = level === 'success' ? 'READY' : level.toUpperCase();
  const prefix = color ? `\x1b[2m${time}\x1b[0m \x1b[${colors[level]}m${label}\x1b[0m` : `${time} ${label}`;
  const line = `${prefix} ${cleanMessage(message)}`;

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export function reportFailure(operation: string, failure: unknown) {
  log('error', `${operation}: ${failureMessage(failure)}`);
}
