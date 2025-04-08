import {UserIcon, EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon} from '$icon';
import {BookIcon, DatabaseIcon, RocketIcon, WebsocketIcon} from '$icon';
import * as rawContent from './content';
import type {PageLoad} from './$types';
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
        {title: 'retrieve information', method: 'GET'},
        {title: 'regenerate name', method: 'PATCH'},
        {title: 'regenerate bio', method: 'PATCH'},
        {title: 'regenerate picture', method: 'PATCH'},
        {title: 'update information', method: 'PUT'},
      ],
    },
    {
      title: 'email address',
      icon: EmailIcon,
      more: [
        {title: 'retrieve recent emails', method: 'GET'},
        {title: 'retrieve more emails', method: 'GET'},
        {title: 'retrieve reply', method: 'GET'},
        {title: 'send email', method: 'POST'},
        {title: 'forward email', method: 'POST'},
        {title: 'save draft', method: 'PUT'},
        {title: 'delete email', method: 'DELETE'},
      ],
    },
    {
      title: 'phone number',
      icon: PhoneIcon,
      more: [
        {title: 'retrieve messages', method: 'GET'},
        {title: 'retrieve conversation', method: 'GET'},
        {title: 'send message', method: 'POST'},
        {title: 'delete conversation', method: 'DELETE'},
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
        {title: 'retrieve accounts', method: 'GET'},
        {title: 'add account', method: 'POST'},
        {title: 'edit account', method: 'PUT'},
        {title: 'update encryption', method: 'PUT'},
        {title: 'delete account', method: 'DELETE'},
      ],
    },
    {
      title: 'websocket',
      icon: WebsocketIcon,
      more: [{title: 'email'}, {title: 'message'}],
    },
  ];

  const content: Docs['content'] = [
    {
      title: 'introduction',
      description: rawContent.introduction,
      icon: BookIcon,
    },
    {
      title: 'getting started',
      description: rawContent.gettingStarted,
      icon: RocketIcon,
    },
    {
      title: 'data overview',
      description:
        'This section details how to retrieve your identity data via the API. It covers the primary endpoint for listing all your synthetic identities associated with your account. You can use the unique id returned for each identity in this list to perform more specific actions in subsequent API calls.',
      icon: DatabaseIcon,
      routes: rawContent.dataOverview,
    },
    {
      title: 'general information',
      description: '',
      icon: UserIcon,
      routes: rawContent.generalInformation,
    },
    {
      title: 'email address',
      description: '',
      icon: EmailIcon,
      routes: rawContent.emailAddress,
    },
    {
      title: 'phone number',
      description: '',
      icon: PhoneIcon,
      routes: rawContent.phoneNumber,
    },
    {
      title: 'virtual card',
      description: rawContent.virtualCard,
      icon: CreditCardIcon,
    },
    {
      title: 'online accounts',
      description: '',
      icon: MultiUsersIcon,
      routes: rawContent.onlineAccounts,
    },
    {
      title: 'websocket',
      description: rawContent.websocket,
      icon: WebsocketIcon,
    },
  ];

  return {docs: {sections, content}};
};
