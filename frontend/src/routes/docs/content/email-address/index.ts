import retrieveRecentEmails from './retrieve-recent-emails';
import retrieveMoreEmails from './retrieve-more-emails';
import retrieveReply from './retrieve-reply';
import forwardEmail from './forward-email';
import deleteEmail from './delete-email';
import sendEmail from './send-email';
import saveDraft from './save-draft';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'retrieve recent emails',
    description: retrieveRecentEmails.description,
    url: '/email/:id',
    method: 'GET',
    code: retrieveRecentEmails.code,
    response: retrieveRecentEmails.response,
  },
  {
    title: 'retrieve more emails',
    description: retrieveMoreEmails.description,
    url: '/email/load-more/:id',
    method: 'GET',
    code: retrieveMoreEmails.code,
    response: retrieveMoreEmails.response,
  },
  {
    title: 'retrieve reply',
    description: retrieveReply.description,
    url: '/email/fetch-reply/:id',
    method: 'GET',
    code: retrieveReply.code,
    response: retrieveReply.response,
  },
  {
    title: 'send email',
    description: sendEmail.description,
    url: '/email/send-email/:id',
    method: 'POST',
    code: sendEmail.code,
    response: sendEmail.response,
  },
  {
    title: 'forward email',
    description: forwardEmail.description,
    url: '/email/forward-email/:id',
    method: 'POST',
    code: forwardEmail.code,
    response: forwardEmail.response,
  },
  {
    title: 'save draft',
    description: saveDraft.description,
    url: '/email/save-draft/:id',
    method: 'PUT',
    code: saveDraft.code,
    response: saveDraft.response,
  },
  {
    title: 'delete email',
    description: deleteEmail.description,
    url: '/email/delete-email/:id',
    method: 'DELETE',
    code: deleteEmail.code,
    response: deleteEmail.response,
  },
];

export default routes;
