import {APP_ORIGIN} from '$constant';

export function GET() {
  const paths = ['', '/docs', '/about', '/contact', '/faq', '/terms-of-service', '/privacy-policy', '/refund-policy'];
  const entries = paths.map((path) => `<url><loc>${APP_ORIGIN}${path || '/'}</loc></url>`).join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    {
      headers: {'Content-Type': 'application/xml; charset=utf-8'},
    },
  );
}
