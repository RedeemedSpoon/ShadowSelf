import retrieveConversation from './retrieve-conversation';
import retrieveMessages from './retrieve-messages';
import deleteConversation from './delete-conversation';
import sendMessage from './send-message';
import type {Route} from '$type';

const routes: Route[] = [
  {
    title: 'retrieve messages',
    description: retrieveMessages.description,
    url: '/phone/:id',
    method: 'GET',
    code: retrieveMessages.code,
    response: retrieveMessages.response,
  },
  {
    title: 'retrieve conversation',
    description: retrieveConversation.description,
    url: '/phone/retrieve-conversation/:id',
    method: 'GET',
    code: retrieveConversation.code,
    response: retrieveConversation.response,
  },
  {
    title: 'send message',
    description: sendMessage.description,
    url: '/phone/send-message/:id',
    method: 'POST',
    code: sendMessage.code,
    response: sendMessage.response,
  },
  {
    title: 'delete conversation',
    description: deleteConversation.description,
    url: '/phone/delete-conversation/:id',
    method: 'DELETE',
    code: deleteConversation.code,
    response: deleteConversation.response,
  },
];

export default routes;
