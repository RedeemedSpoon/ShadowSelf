import type {ContactDetail} from './types';
import {attempt, toTitleCase, sendEmail} from './utils';
import {sql} from './connection';
import {Elysia} from 'elysia';

const app = new Elysia({prefix: '/api'})
  .post('/contact', async ({body}: {body: ContactDetail}) => {
    for (const [key, value] of Object.entries(body)) {
      if (!['category', 'subject', 'message', 'email'].includes(key)) {
        return {message: toTitleCase(key) + ' is not a valid field.', type: 'info'};
      } else if (!value && key !== 'email') {
        return {message: toTitleCase(key) + ' is a required field.', type: 'info'};
      }
    }

    if (body.category.match(/^(question|feedback|collaboration|refund|bug|help|other)$/i) === null) {
      return {message: 'Please enter a valid category.', type: 'alert'};
    }

    if (body.email && body.email.match(/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm) === null) {
      return {message: 'Please enter a valid email address.', type: 'alert'};
    }

    return await sendEmail(body);
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
