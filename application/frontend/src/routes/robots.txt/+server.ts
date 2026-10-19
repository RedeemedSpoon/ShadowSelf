import {APP_ORIGIN} from '$constant';

export function GET() {
  const restricted = ['dashboard', 'settings', 'purchase', 'create', 'identity', 'logout', 'login', 'signup', 'api'];
  const rules = restricted.map((path) => `Disallow: /${path}`).join('\n');

  return new Response(`User-agent: *\nAllow: /\n${rules}\nSitemap: ${APP_ORIGIN}/sitemap.xml\n`, {
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  });
}
