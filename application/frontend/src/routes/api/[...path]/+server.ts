import {reportFailure} from '$logging';
import {env} from '$env/dynamic/private';
import {json, type RequestHandler} from '@sveltejs/kit';

const proxy: RequestHandler = async ({request, params, url}) => {
  try {
    const timeout = /^identities\/[a-zA-Z0-9]{12}\/wallet\/recovery$/.test(params.path || '') ? 140_000 : 30_000;
    const response = await fetch(`${env.BACKEND_URL || 'http://localhost:3000'}/api/${params.path}${url.search}`, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        ...Object.fromEntries(
          ['authorization', 'cookie', 'origin'].flatMap((name) =>
            request.headers.has(name) ? [[name, request.headers.get(name)!]] : [],
          ),
        ),
      },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeout)]),
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (failure) {
    if (!request.signal.aborted) {
      reportFailure(`Frontend proxy ${request.method} /api/${params.path}`, failure);
    }

    return json(
      {error: {code: 'service_unavailable', message: 'The service could not be reached. Please try again.'}},
      {status: 503},
    );
  }
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
