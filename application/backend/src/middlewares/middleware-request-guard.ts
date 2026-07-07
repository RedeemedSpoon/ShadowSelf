import {GuardIssue, QueryRule} from '@type';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

const MEGABYTE = 1024 * 1024;
const MAX_TARGET_LENGTH = 2048;
const MAX_QUERY_LENGTH = 1024;
const MAX_QUERY_PARAMS = 12;
const MAX_QUERY_KEY_LENGTH = 48;
const MAX_QUERY_VALUE_LENGTH = 512;
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_CONTENT_TYPES = new Set(['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']);

const QUERY_RULES: QueryRule[] = [
  {pattern: /^\/api\/email\/load-more\/[^/]+\/?$/, keys: new Set(['mailbox', 'since'])},
  {pattern: /^\/api\/email\/fetch-reply\/[^/]+\/?$/, keys: new Set(['uuid'])},
  {pattern: /^\/api\/phone\/fetch-conversation\/[^/]+\/?$/, keys: new Set(['addressee'])},
  {pattern: /^\/api\/crypto\/swap-rates\/[^/]+\/?$/, keys: new Set(['coinFrom', 'coinTo', 'amount'])},
  {pattern: /^\/billing\/fiat\/checkout\/?$/, keys: new Set(['type'])},
  {pattern: /^\/billing\/fiat\/checkout-after-confirm\/?$/, keys: new Set(['type'])},
  {pattern: /^\/ws-creation-process\/?$/, keys: new Set(['id'])},
];

const invalidPercentEncoding = /%(?![0-9a-f]{2})/i;
const encodedControlByte = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;

export default (app: Elysia) =>
  app.onRequest(({request, set}) => {
    const issue = inspectRequest(request);
    if (issue) return error(set, issue.status, issue.message);
  });

function inspectRequest(request: Request): GuardIssue | undefined {
  const target = getRawTarget(request.url);
  if (target.length > MAX_TARGET_LENGTH) return {status: 414, message: 'Request URL is too long'};
  if (hasMalformedTarget(target)) return {status: 400, message: 'Malformed request URL'};

  const url = new URL(request.url);
  const queryIssue = inspectQuery(url);
  if (queryIssue) return queryIssue;

  const lengthIssue = inspectContentLength(url.pathname, request.headers);
  if (lengthIssue) return lengthIssue;

  return inspectContentType(request);
}

function getRawTarget(rawUrl: string) {
  const protocolIndex = rawUrl.indexOf('://');
  if (protocolIndex === -1) return rawUrl || '/';

  const targetIndex = rawUrl.indexOf('/', protocolIndex + 3);
  return targetIndex === -1 ? '/' : rawUrl.slice(targetIndex);
}

function hasMalformedTarget(target: string) {
  return invalidPercentEncoding.test(target) || encodedControlByte.test(target) || hasControlByte(target);
}

function inspectQuery(url: URL): GuardIssue | undefined {
  const query = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  if (!query) return;
  if (query.length > MAX_QUERY_LENGTH) return {status: 414, message: 'Request query is too long'};

  const allowedKeys = getAllowedQueryKeys(url.pathname);
  if (!allowedKeys) return {status: 400, message: 'Unexpected query string'};

  let count = 0;
  for (const [key, value] of url.searchParams) {
    count++;
    const issue = inspectQueryParam(key, value, allowedKeys, count);
    if (issue) return issue;
  }
}

function inspectQueryParam(key: string, value: string, allowedKeys: Set<string>, count: number): GuardIssue | undefined {
  if (count > MAX_QUERY_PARAMS) return {status: 400, message: 'Too many query parameters'};
  if (!allowedKeys.has(key)) return {status: 400, message: 'Unexpected query parameter'};
  if (key.includes('[') || key.includes(']')) return {status: 400, message: 'Invalid query parameter'};
  if (key.length > MAX_QUERY_KEY_LENGTH) return {status: 400, message: 'Query parameter name is too long'};
  if (value.length > MAX_QUERY_VALUE_LENGTH) return {status: 400, message: 'Query parameter value is too long'};
  if (hasControlByte(key) || hasControlByte(value)) return {status: 400, message: 'Malformed query parameter'};
}

function getAllowedQueryKeys(pathname: string) {
  return QUERY_RULES.find((rule) => rule.pattern.test(pathname))?.keys;
}

function inspectContentLength(pathname: string, headers: Headers): GuardIssue | undefined {
  const rawLength = headers.get('content-length');
  if (!rawLength) return;
  if (!/^\d+$/.test(rawLength)) return {status: 400, message: 'Malformed content length'};

  const length = Number(rawLength);
  const limit = getBodyLimit(pathname);
  if (length > limit) return {status: 413, message: 'Request body is too large'};
}

function getBodyLimit(pathname: string) {
  if (pathname.startsWith('/api/')) return 20 * MEGABYTE;
  if (pathname.startsWith('/webhook-')) return MEGABYTE;
  if (pathname.startsWith('/ws-')) return MEGABYTE;
  if (pathname.startsWith('/billing/crypto/track-invoice/')) return MEGABYTE;
  return 2 * MEGABYTE;
}

function inspectContentType(request: Request): GuardIssue | undefined {
  if (!BODY_METHODS.has(request.method.toUpperCase())) return;
  if (request.headers.get('content-length') === '0') return;

  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (!contentType) return {status: 415, message: 'Missing content type'};
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) return {status: 415, message: 'Unsupported content type'};
}

function hasControlByte(value: string) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}
