export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const ONION_URL = 'http://shadow7sk64geknoyyzsfyjm4rylnknx5pzhfhzkecoggowhitafggqd.onion';
export const CRYPTO_DISCOUNT = 20;

export const PRICING_TIERS = {
  monthly: {
    title: 'Monthly Subscription',
    description: 'per month',
    price: 4.99,
  },

  annually: {
    title: 'Annual Subscription',
    description: 'per year',
    price: 49.99,
  },

  lifetime: {
    title: 'Lifetime Access',
    description: 'one time purchase',
    price: 199.99,
  },
};

export const HOMEPAGE_SERVICES = [
  {
    id: 'identity',
    name: 'Identity',
    title: 'A profile of its own.',
    description: 'Generate a name, biography, location, and portrait, then edit the profile to suit the identity.',
    color: '#a78bfa',
  },
  {
    id: 'vault',
    name: 'Account vault',
    title: 'Passwords and TOTP, per identity.',
    description: 'Save website credentials under the profile that uses them. Unlock passwords and generate two-factor codes in your browser.',
    color: '#fbbf24',
  },
  {
    id: 'email',
    name: 'Email',
    title: 'An inbox of its own.',
    description: 'Receive verification links and correspondence at a dedicated address. Reply, forward, save drafts, and send attachments from the workspace.',
    color: '#fb7185',
  },
  {
    id: 'phone',
    name: 'Phone',
    title: 'SMS under a separate number.',
    description: "Send and receive SMS with the identity's number. Verification codes and conversations stay with the accounts they're for.",
    color: '#38bdf8',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    title: 'Wallets under each identity.',
    description: 'Receive Bitcoin, Litecoin, Ethereum, USDT, and Monero. Sign transfers in your browser and track balances and transactions per identity.',
    color: '#34d399',
  },
] as const;

export const HOMEPAGE_IDENTITY_EXAMPLES = [
  {
    name: 'Theo Mercer',
    handle: 'theo_m',
    purpose: 'Communities',
    description: 'Forums, discussion groups, and the accounts you use to take part.',
    email: 'theo.mercer@example.com',
    phone: '+1 202 555 0142',
    color: '#a78bfa',
    accounts: [
      {name: 'Photography forum', detail: 'theo_m'},
      {name: 'Design community', detail: 'theo.mercer'},
      {name: 'Reading group', detail: 'theo_reads'},
    ],
    messages: [
      {name: 'Photography forum', detail: 'Confirm your email address'},
      {name: 'Design community', detail: 'Your weekly discussion digest'},
    ],
  },
  {
    name: 'Mara Soler',
    handle: 'mara_studio',
    purpose: 'Public project',
    description: 'A project with its own public name and correspondence.',
    email: 'mara.studio@example.com',
    phone: '+1 202 555 0156',
    color: '#fb7185',
    accounts: [
      {name: 'Portfolio', detail: 'mara_studio'},
      {name: 'Print marketplace', detail: 'mara.prints'},
      {name: 'Newsletter', detail: 'studio_notes'},
    ],
    messages: [
      {name: 'Print marketplace', detail: 'Your print listing is published'},
      {name: 'Portfolio', detail: 'A new enquiry for your studio'},
    ],
  },
  {
    name: 'Samir Nassar',
    handle: 'samir_n',
    purpose: 'Shopping',
    description: 'Orders, receipts, and retailer accounts kept away from your everyday inbox.',
    email: 'samir.orders@example.com',
    phone: '+1 202 555 0183',
    color: '#34d399',
    accounts: [
      {name: 'Bookshop', detail: 'samir_n'},
      {name: 'Outdoor store', detail: 'samir.outdoors'},
      {name: 'Music shop', detail: 'samir_records'},
    ],
    messages: [
      {name: 'Bookshop', detail: 'Your order receipt'},
      {name: 'Outdoor store', detail: 'Your parcel has been dispatched'},
    ],
  },
] as const;

export const CONTACT_CATEGORIES = [
  {value: 'question', label: 'Question'},
  {value: 'feedback', label: 'Feedback'},
  {value: 'collaboration', label: 'Collaboration'},
  {value: 'bug', label: 'Bug report'},
  {value: 'help', label: 'Account or payment'},
  {value: 'refund', label: 'Refund'},
  {value: 'other', label: 'Other'},
] as const;
