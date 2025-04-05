import {BookIcon, DatabaseIcon, LightBulbIcon, RocketIcon, WebsocketIcon} from '$icon';
import {UserIcon, EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon} from '$icon';
import type {PageLoad} from './$types';
import * as HTMLContent from './content';
import type {Docs} from '$type';

export const load: PageLoad = () => {
  const sections: Docs['sections'] = [
    {
      title: 'introduction',
      icon: BookIcon,
      more: [{title: 'purpose'}, {title: 'use cases'}, {title: 'considerations'}, {title: 'feedback & contributions'}],
    },
    {
      title: 'getting started',
      icon: RocketIcon,
      more: [{title: 'api key & access'}, {title: 'authentication'}, {title: 'test integration'}],
    },
    {
      title: 'data overview',
      icon: DatabaseIcon,
      more: [{title: 'list identities', method: 'GET'}],
    },
    {
      title: 'general information',
      icon: UserIcon,
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
      icon: EmailIcon,
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
      icon: PhoneIcon,
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
      icon: CreditCardIcon,
      more: [{title: 'under development'}],
    },
    {
      title: 'online accounts',
      icon: MultiUsersIcon,
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
      icon: WebsocketIcon,
      more: [{title: 'email'}, {title: 'message'}],
    },
    {
      title: 'examples',
      icon: LightBulbIcon,
      more: [{title: 'sending email'}, {title: 'fetching conversation'}, {title: 'editing account'}],
    },
  ];

  const content: Docs['content'] = [
    {
      title: 'introduction',
      description: HTMLContent.introduction,
      icon: BookIcon,
    },
    {
      title: 'getting started',
      description: HTMLContent.introduction,
      icon: RocketIcon,
    },
    {
      title: 'data overview',
      description: HTMLContent.introduction,
      icon: DatabaseIcon,
    },
    {
      title: 'general information',
      description: HTMLContent.introduction,
      icon: UserIcon,
    },
    {
      title: 'email address',
      description: HTMLContent.introduction,
      icon: EmailIcon,
    },
    {
      title: 'phone number',
      description: HTMLContent.introduction,
      icon: PhoneIcon,
    },
    {
      title: 'virtual card',
      description: HTMLContent.introduction,
      icon: CreditCardIcon,
    },
    {
      title: 'online accounts',
      description: HTMLContent.introduction,
      icon: MultiUsersIcon,
    },
    {
      title: 'websocket',
      description: HTMLContent.introduction,
      icon: WebsocketIcon,
    },
    {
      title: 'examples',
      description: HTMLContent.introduction,
      icon: LightBulbIcon,
    },
  ];

  return {docs: {sections, content}};
};
