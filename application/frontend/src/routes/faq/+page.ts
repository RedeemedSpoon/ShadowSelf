import type {PageLoad} from './$types';
import type {Faq} from '$type';

export const load: PageLoad = () => {
  return {
    faqs: [
      {
        question: 'What is ShadowSelf?',
        answer:
          "ShadowSelf is a tool that lets you create completely fake (yet functional) online identities. Want to sign up for a service without revealing your true self? ShadowSelf's got you covered. With it, you can create phone numbers, email addresses, and even fully anonymous crypto wallets.",
      },
      {
        question: 'How does ShadowSelf work?',
        answer:
          'Think of ShadowSelf as a master illusionist. It weaves together a tapestry of different tools and services to create these fake identities. We use a mix of APIs, virtual phone number providers, and more to automatically manage these synthetic personas.',
      },
      {
        question: 'Is ShadowSelf safe to use?',
        answer:
          "Absolutely! We've taken every precaution to ensure your privacy and security. ShadowSelf is open-source, meaning anyone can inspect its code to verify its safety. Plus, we've implemented robust security measures to protect your data. So, go ahead and use it without worry.",
      },
      {
        question: 'Is ShadowSelf legal to use?',
        answer:
          "Well... yes, ShadowSelf is a legal tool, but it's important to use it responsibly. Creating fake identities can raise eyebrows, especially if you use them for malicious purposes. So, please, use it for good, not evil.",
      },
      {
        question: 'How much does ShadowSelf cost?',
        answer:
          "We keep it affordable. You can choose from a monthly plan for $5, an annual plan for $50, or a lifetime plan for $200. If you pay with crypto (BTC, LTC, XMR, ETH, USDT), we give you a 20% discount across the board. That drops the price to €4/month, €40/year, or €160 for lifetime. It's cheaper, more private, and helps support the ecosystem we're all trying to build.",
      },
      {
        question: 'What are synthetic identities?',
        answer:
          "Think of synthetic identities as your digital disguises. They're fake identities that look and sound real, but they're completely separate from your actual identity. No one can trace them back to you, not even the most skilled hacker. It's like having a secret identity, just like your favorite superhero.",
      },
      {
        question: 'How do I use synthetic identities?',
        answer:
          "Using ShadowSelf is as easy as pie. Just create an account, choose a plan that suits your needs, and you're ready to start generating your own synthetic identities. Our intuitive dashboard makes it simple to manage and customize your fake personas.",
      },
      {
        question: 'Can I customize synthetic identities?',
        answer:
          "Absolutely! When you first create an account, you can tailor your synthetic identities to your preferences. You can modify things like email, phone number, and even personal details. However, once you've created an identity, some aspects may be locked down for annoyances reasons.",
      },
      {
        question: 'Can I permanently delete synthetic identities?',
        answer:
          'Deleting your ShadowSelf account will remove your synthetic identities and stop your subscription. To erase them manually, go to the individual identity pages and delete it there. This is permanent, so be sure before proceeding.',
      },
      {
        question: 'What are the benefits of synthetic identities?',
        answer:
          'Synthetic identities offer a wide range of benefits for online privacy and security. By using fake identities, you can protect your personal information from data breaches, phishing attacks, and other online threats. Pretty good way to hide your digital footprint online.',
      },
      {
        question: 'What are the limitations of synthetic identities?',
        answer:
          "While synthetic identities are powerful tools, they're not foolproof. Some websites may flag accounts that appear too automated or suspicious. It's important to use them responsibly and avoid behaviors that might raise red flags.",
      },
      {
        question: 'What are the specific features of my synthetic identity?',
        answer:
          'Think of it as a complete ghost kit. Each identity is a suite of tools: a Synthetic Persona (AI-generated picture, name, bio, etc.), a private Email Service (@shadowself.io), a real Phone Number for SMS, a non-custodial Crypto Wallet, an encrypted Account Vault for your passwords and online accounts, and VPN/Proxy access to mask your location.',
      },
      {
        question: 'What cryptocurrencies does the wallet support?',
        answer:
          "We're not a casino, so we don't support every meme coin under the sun. Our wallet is a toolkit, and we've picked the best tools: Bitcoin (BTC) for savings, Monero (XMR) for privacy, Litecoin (LTC) for cheap payments, and Ethereum (ETH) & USDT on low-fee networks like Polygon/Arbitrum for stability and utility.",
      },
      {
        question: 'How can I pay for an identity?',
        answer:
          'We give you two paths: the Normie Way and the Shadow Way. The Normie Way is paying with a credit card via Stripe, quick and easy, but they know who you are. The Shadow Way is paying with crypto. To thank you for using sovereign money, you get a 20% discount if you pay with BTC, LTC, XMR, ETH, or USDT.',
      },
      {
        question: 'Is there a mobile app for ShadowSelf?',
        answer:
          "Not yet, at least. We're a bit swamped right now, so a mobile app isn't on the immediate horizon. Maybe if we get a ton of users, we'll reconsider. For now, you'll have to stick to the web version.",
      },
      {
        question: 'Does ShadowSelf work with specific browsers?',
        answer:
          "Most browsers should work fine with our web extension. However, Safari is a no-go. Honestly, you should probably avoid Safari anyway, it's not the most secure browser out there. it's proprietary and very likely filled with backdoors and spywares",
      },
      {
        question: 'Is Shadowself open source? Can I contribute?',
        answer:
          "Absolutely! We're an open-source project, so feel free to dive into the code and make improvements. Just please, don't break anything, implement badly optimized code or fuck up the styling. We're relying on you!",
      },
      {
        question: 'What are the third-party services used by ShadowSelf?',
        answer:
          'We utilize a robust stack to keep you hidden. For identities, we use Gemini Nano on Banana for image generation and Twilio for phone lines. Infrastructure runs on Vultr with domains via Epik. For fiat payments, we use Stripe. Our sovereign crypto engine relies on Coinsbee for gift cards, Trocador for swaps, market data from CoinGecko, and public RPCs nodes (such as mempool.space, litecoinspace.org and eth.blockscout.com).',
      },
      {
        question: 'Can I integrate ShadowSelf with other infrastructures and apps?',
        answer:
          "Definitely! We have an API that you can use to integrate ShadowSelf into your own projects and infrastructures. Wield our power to make great things happen and to connect the dots. Just don't be a jerk and spam us with requests, okay?",
      },
      {
        question: 'Can we spy on you and your synthetic identities?',
        answer:
          "Absolutely not! That goes against everything we stand for. We're committed to your privacy. In fact, our system is designed to run on autopilot, so no human eyes ever see your sensitive information. It's like having a robot butler who respects your privacy.",
      },
      {
        question: 'Centrelised services are bad, how are you different?',
        answer:
          "You're absolutely right. Centralized services can be risky. Unfortunately, until we see a major breakthrough in web3 technology, we're stuck with this model. We're constantly working to minimize the risks and maximize your privacy, but there's only so much we can do at this point.",
      },
      {
        question: "Aren't people gonna use ShadowSelf to hide their crimes?",
        answer:
          "It's a valid concern. People can use any tool for good or evil. However, we're not responsible for how people choose to use our service and we quite frankly don't care all that much. We're simply providing a tool to protect your privacy, and how you use it is up to you.",
      },
      {
        question: "Aren't you exploiting the need for privacy for financial gain?",
        answer:
          "Well, to be honest, yes. But we're also providing a valuable service. Running and maintaining a service like ShadowSelf costs money. We need to cover our expenses to keep the lights on. It's a balancing act between providing a service and making a profit. But hey, isn't that how most businesses work?",
      },
    ] satisfies Faq[],
  };
};
