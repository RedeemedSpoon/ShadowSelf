import {reportFailure} from '$logging';
import {ONION_URL, BILLING_RECEIPT_PATH_PATTERN} from '$constant';
import {createRequestLimiter} from '$lib/request-limits.server';
import {error, json, redirect, text, type Handle, type HandleServerError} from '@sveltejs/kit';
import {backend} from '$lib/backend.server';

const limitRequest = createRequestLimiter();

export const handle: Handle = async ({event, resolve}) => {
  const {request, url} = event;
  const apiRequest = url.pathname === '/api' || url.pathname.startsWith('/api/');

  if (!apiRequest && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (request.headers.get('origin') !== url.origin) {
      const message = `Cross-site ${request.method} form submissions are forbidden`;

      return request.headers.get('accept') === 'application/json'
        ? json({message}, {status: 403})
        : text(message, {status: 403});
    }
  }

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

  const token = event.cookies.get('token');
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

export const handleError: HandleServerError = ({error: failure, event, status}) => {
  reportFailure(`Frontend ${event.request.method} ${event.route.id || '/unknown'} (HTTP ${status})`, failure);

  return {message: 'The page could not be loaded. Please try again.'};
};
