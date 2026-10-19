export const ETHNICITIES = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
export const ONION_URL = 'http://shadow7sk64geknoyyzsfyjm4rylnknx5pzhfhzkecoggowhitafggqd.onion';
export const CRYPTO_DISCOUNT = 20;
export const UTXO_HARD_LIMIT = 120;

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
    description:
      'Save website credentials under the profile that uses them. Unlock passwords and generate two-factor codes in your browser.',
    color: '#fbbf24',
  },
  {
    id: 'email',
    name: 'Email',
    title: 'An inbox of its own.',
    description:
      'Receive verification links and correspondence at a dedicated address. Reply, forward, save drafts, and send attachments from the workspace.',
    color: '#fb7185',
  },
  {
    id: 'phone',
    name: 'Phone',
    title: 'SMS under a separate number.',
    description:
      "Send and receive SMS with the identity's number. Verification codes and conversations stay with the accounts they're for.",
    color: '#38bdf8',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    title: 'Wallets under each identity.',
    description:
      'Receive Bitcoin, Litecoin, Ethereum, USDT, and Monero. Sign transfers in your browser and track balances and transactions per identity.',
    color: '#34d399',
  },
  {
    id: 'card',
    name: 'Credit card',
    title: 'A virtual card for online purchases.',
    description: 'Keep virtual card details, spending limits, and payment records with the identity that uses them.',
    color: '#e879f9',
  },
  {
    id: 'proxy',
    name: 'Residential proxies',
    title: 'A connection for each identity.',
    description:
      'Manage residential proxy settings per identity and check provider status. A different IP address does not remove cookies or browser fingerprints.',
    color: '#a3e635',
  },
  {
    id: 'cloud',
    name: 'Online drive',
    title: 'Files under each identity.',
    description:
      'Store identity files together. Inspect, remove, or edit image metadata and prepare pictures with watermarks and cloaking before sharing.',
    color: '#fb923c',
  },
] as const;

export const HOMEPAGE_EXAMPLE_IDENTITY = {
  name: 'Theo Mercer',
  handle: 'theo_m',
  email: 'theo.mercer@example.com',
  phone: '+1 202 555 0142',
} as const;

export const CONTACT_CATEGORIES = [
  {value: 'question', label: 'Question'},
  {value: 'feedback', label: 'Feedback'},
  {value: 'collaboration', label: 'Collaboration'},
  {value: 'bug', label: 'Bug report'},
  {value: 'help', label: 'Account or payment'},
  {value: 'refund', label: 'Refund'},
  {value: 'other', label: 'Other'},
] as const;

export const EXTENSION_STORES = [
  {browser: 'Firefox', href: 'https://addons.mozilla.org/en-US/firefox/addon/shadowself'},
  {browser: 'Chrome', href: 'https://chromewebstore.google.com/detail/shadowself/paaidpbnnoopadhdodbjgfhfhhonmbmf'},
  {browser: 'Opera', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'},
  {
    browser: 'Edge',
    href: 'https://microsoftedge.microsoft.com/addons/detail/shadowself/fjlfnbhdginnpjnlkhhbjhejgaamhdhb',
  },
] as const;
