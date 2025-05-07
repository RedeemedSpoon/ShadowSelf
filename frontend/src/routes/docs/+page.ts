import {UserIcon, EmailIcon, PhoneIcon, CreditCardIcon, MultiUsersIcon} from '$icon';
import {BookIcon, DatabaseIcon, RocketIcon, WebsocketIcon, ProxyIcon} from '$icon';
import * as rawContent from './content';
import type {PageLoad} from './$types';
import type {Docs, Route} from '$type';

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
      more: [
        {title: 'list identities', method: 'GET'},
        {title: 'list proxies', method: 'GET'},
      ],
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
      more: [{title: 'email type'}, {title: 'message type'}],
    },
    {
      title: 'proxy',
      icon: ProxyIcon,
      more: [{title: 'implementation'}],
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
        'This section details how to retrieve your identity data via the API. It covers the two primary endpoint for listing all your synthetic identities associated with your account. You can use the unique id returned for each identity in this list to perform more specific actions in subsequent API calls.',
      icon: DatabaseIcon,
      routes: rawContent.dataOverview,
    },
    {
      title: 'general information',
      description:
        "This section covers API endpoints for managing your identity's general information, including name, bio, and picture. You can retrieve and update these details using the appropriate endpoints.",
      icon: UserIcon,
      routes: rawContent.generalInformation,
    },
    {
      title: 'email address',
      description:
        "This section details the API endpoints for managing the email functionality associated with your synthetic identities. These endpoints allow you to interact with the identity's dedicated email account, enabling actions like retrieving emails, sending new messages, managing drafts, and deleting emails programmatically.",
      icon: EmailIcon,
      routes: rawContent.emailAddress,
    },
    {
      title: 'phone number',
      description:
        'This section covers API endpoints for interacting with the virtual phone number associated with your synthetic identities, specifically for sending and receiving SMS messages. You can retrieve message history, fetch full conversations, send new messages, and manage conversations programmatically.',
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
      description:
        "This section details the API endpoints for managing stored online account credentials associated with your synthetic identities. You can securely store website login information (username, password, website URL) and Time-based One-Time Password (TOTP) secrets for accounts you've signed up for using the identity's email or phone number, name etc...",
      icon: MultiUsersIcon,
      routes: rawContent.onlineAccounts,
    },
    {
      title: 'websocket',
      description: rawContent.websocketDesc,
      icon: WebsocketIcon,
      routes: rawContent.websocket as unknown as Route[],
    },
    {
      title: 'proxy',
      description: rawContent.proxyDesc,
      icon: ProxyIcon,
      routes: rawContent.proxy as unknown as Route[],
    },
  ];

  return {docs: {sections, content}};
};
