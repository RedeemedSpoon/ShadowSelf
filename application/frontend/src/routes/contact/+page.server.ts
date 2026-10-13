import {fail} from '@sveltejs/kit';
import type {Actions} from './$types';
import {backend} from '$lib/backend.server';
import {CONTACT_CATEGORIES} from '$constant';

export const actions: Actions = {
  default: async ({request}) => {
    const data = await request.formData();

    const values = Object.fromEntries(['email', 'subject', 'message', 'category'].map((name) => [name, String(data.get(name) || '').trim()]));

    if (!values.subject || !values.message || !CONTACT_CATEGORIES.some((item) => item.value === values.category)) {
      return fail(400, {error: 'Enter a subject, message, and valid category.', values});
    }

    if (values.subject.length > 120 || values.message.length > 10000 || values.email.length > 254) {
      return fail(400, {error: 'Keep the subject under 120 characters and the message under 10,000 characters.', values});
    }

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      return fail(400, {error: 'Enter a valid reply email address, or leave it empty.', values});
    }

    const result = await backend<{message: string}>('/contact', 'POST', values);

    if (!result.ok) {
      return fail(result.status || 503, {error: result.error, values});
    }

    return {success: result.data.message || 'Your message was sent.'};
  },
};
