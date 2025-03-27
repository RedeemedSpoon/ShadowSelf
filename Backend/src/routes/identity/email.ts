import {fetchRecentEmails} from '@utils/email-imap';
import middleware from '@middleware-api';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/email'}).use(middleware).get('/:id', async ({identity}) => {
  const emails = await fetchRecentEmails(identity!.email, identity!.email_password);
  return emails;
});
