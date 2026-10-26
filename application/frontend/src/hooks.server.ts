import {env} from '$env/dynamic/private';
import {ONION_URL, BILLING_RECEIPT_PATH_PATTERN} from '$constant';
import {createRequestLimiter} from '$lib/request-limits.server';
import {error, redirect, type Handle} from '@sveltejs/kit';
import {sequence} from '@sveltejs/kit/hooks';
import {backend} from '$lib/backend.server';
import csrf from '$utils/csrf';

const limitRequest = createRequestLimiter();

const authenticate: Handle = async ({event, resolve}) => {
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(event.request.method);
  const sensitive =
    mutation &&
    ['/login', '/signup', '/contact', '/api/auth/', '/api/contact'].some((path) => event.url.pathname.startsWith(path));

  const onion = Boolean(ONION_URL) && event.url.origin === ONION_URL;

  if (!limitRequest(onion ? 'onion' : event.getClientAddress(), sensitive, onion)) {
    return new Response(
      JSON.stringify({error: {code: 'rate_limited', message: 'Too many requests. Wait before retrying'}}),
      {
        status: 429,
        headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
      },
    );
  }

  if (env.PURCHASE_REVIEW === 'true') {
    if (event.url.pathname.startsWith('/api/')) {
      error(403, 'API requests are disabled in the purchase review copy.');
    }

    if (event.url.pathname === '/' || event.url.pathname === '/purchase') {
      redirect(303, '/purchase-review');
    }
  }

  const token = env.PURCHASE_REVIEW === 'true' ? undefined : event.cookies.get('token');
  const path = event.url.pathname;
  const receiptPage = BILLING_RECEIPT_PATH_PATTERN.test(path);
  const receiptRequest = receiptPage || path.startsWith('/api/billing/receipts/');
  const protectedRoute =
    !receiptPage &&
    ['/dashboard', '/settings', '/identity', '/purchase', '/create'].some(
      (route) => path === route || path.startsWith(`${route}/`),
    );
  event.locals.user = '';

  if (token && !receiptPage && !path.startsWith('/api/')) {
    const result = await backend<{username: string}>('/auth/session', 'GET', undefined, token);

    if (result.ok) {
      event.locals.user = result.data.username;
    } else {
      if (result.status === 401) {
        event.cookies.delete('token', {path: '/'});
      } else {
        if (protectedRoute) {
          error(503, result.error);
        }
      }
    }
  }

  if (protectedRoute && !event.locals.user) {
    redirect(303, '/login');
  }

  if (['/login', '/signup'].includes(path) && event.locals.user) {
    redirect(303, '/dashboard');
  }

  if (path === '/identity' || path === '/identity/') {
    redirect(303, '/dashboard');
  }

  const response = await resolve(event);

  if (token || protectedRoute || receiptRequest) {
    response.headers.set('cache-control', 'no-store');
  }

  if (receiptRequest) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', receiptRequest ? 'no-referrer' : 'same-origin');

  return response;
};

export const handle = sequence(csrf([]), authenticate);
