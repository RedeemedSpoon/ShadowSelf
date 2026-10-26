import DOMPurify from 'dompurify';
import type {Cookies} from '@sveltejs/kit';
import type {Attachment} from '$type';

export function createCookie(cookies: Cookies, name: string, value: string) {
  const maxAge = 90 * 24 * 3600;
  cookies.set(name, value, {path: '/', httpOnly: true, secure: true, sameSite: 'strict', maxAge});
}

export function base64ToBlob(base64: string, type = 'image/png') {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type});

  return blob;
}

export function sanitizeEmailHtml(html: string, attachments: Attachment[] = []) {
  if (typeof window === 'undefined') {
    return '';
  }

  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: {html: true},
    FORBID_TAGS: [
      'style',
      'link',
      'meta',
      'base',
      'form',
      'input',
      'button',
      'video',
      'audio',
      'source',
      'iframe',
      'object',
      'embed',
    ],
    FORBID_ATTR: ['style', 'srcset', 'background', 'ping', 'action', 'formaction'],
  });
  const document = new DOMParser().parseFromString(clean, 'text/html');

  for (const element of document.querySelectorAll('[src]')) {
    let source = element.getAttribute('src') || '';

    if (source.startsWith('cid:')) {
      const attachment = attachments.find((attachment) => attachment.cid?.replace(/[<>]/g, '') === source.slice(4));

      if (attachment) {
        source = `data:${attachment.contentType};base64,${attachment.data}`;
      }

      element.setAttribute('src', source);
    }

    if (element.tagName !== 'IMG' || !/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(source)) {
      element.removeAttribute('src');
    }
  }

  for (const link of document.querySelectorAll('a')) {
    const href = link.getAttribute('href') || '';

    if (!/^(https?:|mailto:)/i.test(href)) {
      link.removeAttribute('href');
    }

    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }

  return document.body.innerHTML;
}
