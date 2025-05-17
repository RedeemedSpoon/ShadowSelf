import type {Handle} from '@sveltejs/kit';
import {json, text} from '@sveltejs/kit';

export default function csrf(allowedPaths: string[], allowedOrigins: string[] = []): Handle {
  return async ({event, resolve}) => {
    const {request, url} = event;
    const requestOrigin = request.headers.get('origin');
    const isSameOrigin = requestOrigin === url.origin;
    const isAllowedOrigin = allowedOrigins.includes(requestOrigin ?? '');
    const isAllowedPath = allowedPaths.includes(url.pathname);
    const isAllowedMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

    const forbidden = isFormContentType(request) && isAllowedMethod && !isSameOrigin && !isAllowedOrigin && !isAllowedPath;

    if (forbidden) {
      const message = `Cross-site ${request.method} form submissions are forbidden`;
      if (request.headers.get('accept') === 'application/json') {
        return json({message}, {status: 403});
      }
      return text(message, {status: 403});
    }

    return resolve(event);
  };
}

function isContentType(request: Request, ...types: string[]) {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? '';
  return types.includes(type.toLowerCase());
}

function isFormContentType(request: Request) {
  return isContentType(request, 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain');
}
