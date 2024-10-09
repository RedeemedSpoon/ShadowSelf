import {Elysia} from 'elysia';
import attempt from './attempt';
import sql from './db-connect';

const app = new Elysia({prefix: '/api'})
  .post('/join', async ({body}: {body: {email: string}}) => {
    const email = body.email.toLowerCase();

    if (email.match(/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm) === null) {
      return {message: 'Please enter a valid email address.', type: 'alert'};
    }

    const result = await attempt(sql`INSERT INTO users (email) VALUES (${email})`, '🥳 Thank you for joining!');

    if (result.message.match(/unique.*constraint/)) {
      return {message: 'You have already joined :)', type: 'info'};
    }

    return result;
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
