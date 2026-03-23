import WebsocketIcon from '$icon/communication/Websocket.svelte';
import MultiUsersIcon from '$icon/user/MultiUsers.svelte';
import ProxyIcon from '$icon/communication/Proxy.svelte';
import EmailIcon from '$icon/communication/Email.svelte';
import PhoneIcon from '$icon/communication/Phone.svelte';
import DatabaseIcon from '$icon/data/Database.svelte';
import WalletIcon from '$icon/finance/Wallet.svelte';
import RocketIcon from '$icon/misc/Rocket.svelte';
import BookIcon from '$icon/misc/Book.svelte';
import UserIcon from '$icon/user/User.svelte';

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
      title: 'crypto wallet',
      icon: WalletIcon,
      more: [
        {title: 'retrieve wallet', method: 'GET'},
        {title: 'retrieve xmr node', method: 'GET'},
        {title: 'retrieve swap rates', method: 'GET'},
        {title: 'create swap trade', method: 'POST'},
        {title: 'broadcast transaction', method: 'POST'},
        {title: 'sweep information', method: 'POST'},
        {title: 'update wallet encryption', method: 'PUT'},
      ],
    },
    {
      title: 'account vault',
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
        'This section covers API endpoints for interacting with the phone number associated with your synthetic identities, specifically for sending and receiving SMS messages. You can retrieve message history, fetch full conversations, send new messages, and manage conversations programmatically.',
      icon: PhoneIcon,
      routes: rawContent.phoneNumber,
    },
    {
      title: 'crypto wallet',
      description:
        'This section covers API endpoints for managing the crypto wallet associated with your synthetic identities. You can retrieve wallet balances, transaction history, and swap rates, as well as create swap trades and broadcast transactions. Note that Monero (XMR) operations are handled entirely on the client-side for security reasons; the API only provides node connection details.',
      icon: WalletIcon,
      routes: rawContent.cryptoWallet as unknown as Route[],
    },
    {
      title: 'account vault',
      description:
        "This section details the API endpoints for managing stored account credentials associated with your synthetic identities. You can securely store website login information (username, password, website URL) and Time-based One-Time Password (TOTP) secrets for accounts you've signed up for using the identity's email or phone number, name etc...",
      icon: MultiUsersIcon,
      routes: rawContent.accountVault,
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
