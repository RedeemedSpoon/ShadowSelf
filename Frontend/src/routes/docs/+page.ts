import type {PageLoad} from './$types';
import type {Docs} from '$type';

export const load: PageLoad = () => {
  const sections: Docs['sections'] = [
    {
      title: 'introduction',
      more: [{title: 'purpose'}, {title: 'uses cases'}, {title: 'important'}],
    },
    {
      title: 'getting started',
      more: [{title: 'api key & access'}, {title: 'authentication'}, {title: 'test integration'}],
    },
    {
      title: 'data overview',
      more: [{title: 'list identities', method: 'GET'}],
    },
    {
      title: 'general information',
      more: [
        {
          title: 'retrieve information',
          method: 'GET',
        },
        {
          title: 'regenerate name',
          method: 'PATCH',
        },
        {
          title: 'regenerate bio',
          method: 'PATCH',
        },
        {
          title: 'regenerate picture',
          method: 'PATCH',
        },
        {
          title: 'update information',
          method: 'PUT',
        },
      ],
    },
    {
      title: 'email address',
      more: [
        {
          title: 'retrieve recent emails',
          method: 'GET',
        },
        {
          title: 'retrieve more emails',
          method: 'GET',
        },
        {
          title: 'retrieve reply',
          method: 'GET',
        },
        {
          title: 'send email',
          method: 'POST',
        },
        {
          title: 'forward email',
          method: 'POST',
        },
        {
          title: 'save draft',
          method: 'PUT',
        },
        {
          title: 'delete email',
          method: 'DELETE',
        },
      ],
    },
    {
      title: 'phone number',
      more: [
        {
          title: 'retrieve messages',
          method: 'GET',
        },
        {
          title: 'retrieve conversation',
          method: 'GET',
        },
        {
          title: 'send message',
          method: 'POST',
        },
        {
          title: 'delete conversation',
          method: 'DELETE',
        },
      ],
    },
    {
      title: 'virtual card',
      more: [{title: 'under development'}],
    },
    {
      title: 'online accounts',
      more: [
        {
          title: 'retrieve accounts',
          method: 'GET',
        },
        {
          title: 'add account',
          method: 'POST',
        },
        {
          title: 'edit account',
          method: 'PUT',
        },
        {
          title: 'update encryption',
          method: 'PUT',
        },
        {
          title: 'delete account',
          method: 'DELETE',
        },
      ],
    },
    {
      title: 'websocket',
      more: [{title: 'email'}, {title: 'message'}],
    },
    {
      title: 'examples',
      more: [{title: 'sending email'}, {title: 'fetch conversation'}, {title: 'editing account'}],
    },
  ];

  const content: Docs['content'] = [];

  return {docs: {sections, content}};
};
