<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
  import {CRYPTO_DISCOUNT, PRICING_TIERS} from '$constant';

  const groups = [
    {
      title: 'Using identities',
      questions: [
        {
          question: 'What does each identity include?',
          answer:
            'A generated profile and portrait, a dedicated email address and SMS number, an account vault, and cryptocurrency wallets. They share one workspace and API, so an identity can maintain its own accounts and correspondence without reusing your personal contact details.',
        },
        {
          question: 'Which details can I change?',
          answer:
            'Choose a location, edit the generated profile, regenerate the portrait, and select an email address and available phone number during creation. The profile remains editable afterward. The provisioned mailbox and number stay attached to the identity.',
        },
        {
          question: 'Can I use the email and phone number for verification?',
          answer:
            'The mailbox receives verification links and the number receives SMS codes. Acceptance depends on the service you are signing up for; some reject provider-issued numbers. A generated profile does not satisfy a legal identity check.',
        },
        {
          question: 'What does the browser extension do?',
          answer:
            'It connects a browser window to a signed-in ShadowSelf tab, then lets you find and open identities from that account. Builds are available for Firefox and Chromium browsers. Residential routing is planned; the current extension uses your existing connection and does not isolate cookies.',
        },
        {
          question: 'Can I automate it or use my own client?',
          answer:
            'Yes. Enable API access in settings and generate a key. The REST API covers identity creation, profiles, vault entries, mail, SMS, wallets, and billing. Clients encrypt and decrypt vault secrets locally. The API reference includes request formats and recovery behavior.',
        },
        {
          question: 'Which assets do the wallets support?',
          answer:
            'Bitcoin, Litecoin, Ethereum, USDT on Ethereum, and Monero. Wallet keys are generated and encrypted in your browser, which also signs outgoing transactions. Trocador handles supported swaps. The web application includes the wallet tools on mobile as well as desktop.',
        },
      ],
    },
    {
      title: 'Privacy and trust',
      questions: [
        {
          question: 'What can ShadowSelf see?',
          answer:
            'The server handles profile details, account usernames and website addresses, email, SMS, and billing records. Vault passwords, TOTP secrets, and wallet private keys arrive encrypted. Your master password stays in the browser. That protects those secrets; messages and profile data are not end-to-end encrypted.',
        },
        {
          question: 'What can connect my identities to each other?',
          answer:
            'Shared IP addresses, cookies, browser fingerprints, reused payment sources, and your own activity can connect accounts. Public blockchain transactions can also be traced between addresses. ShadowSelf separates the profile, credentials, and communication tools; your browser and network setup still matter.',
        },
        {
          question: 'What if I lose my master password?',
          answer:
            'Account recovery restores sign-in access, but cannot decrypt the stored vault or wallet keys. There is no server-side master-password reset. Keep your wallet recovery phrase separately from the encrypted vault.',
        },
        {
          question: 'Is centralizing identities a privacy risk?',
          answer:
            'Yes. ShadowSelf brings identity records and service access under one account, which makes that account a valuable target. Local encryption limits what a server compromise can expose, but mail, phone services, and other records still depend on servers. Two-factor authentication and separate master passwords reduce different parts of that risk.',
        },
        {
          question: 'Can I inspect the code or self-host it?',
          answer:
            'The application and extension are open source under AGPL-3.0. You can inspect, modify, and run them yourself. Self-hosting requires your own mail infrastructure and provider accounts for the services you enable. The repository contains setup instructions.',
        },
        {
          question: 'Which outside providers handle identity data?',
          answer:
            'Twilio handles phone numbers and SMS, configured mail services handle email, and Gemini generates portraits. Stripe processes card payments and Trocador handles crypto conversions. Wallet tools query blockchain endpoints and CoinGecko market data. Each provider receives the information needed for its operation; the privacy policy describes those data flows.',
        },
        {
          question: "Won't people misuse it?",
          answer:
            'Privacy tools can be misused. We build ShadowSelf because keeping personal details out of online accounts is a legitimate need. Fraud, phishing, spam, and other abuse violate the terms and can lead to suspension.',
        },
      ],
    },
    {
      title: 'Billing and ownership',
      questions: [
        {
          question: 'How much does an identity cost?',
          answer: `$${PRICING_TIERS.monthly.price} monthly, $${PRICING_TIERS.annually.price} annually, or $${PRICING_TIERS.lifetime.price} for lifetime access. Each plan includes the same tools. Pay by card through Stripe or by cryptocurrency with a ${CRYPTO_DISCOUNT}% discount. Card subscriptions renew automatically; crypto renewals are manual.`,
        },
        {
          question: 'Why charge for privacy?',
          answer:
            'Phone numbers, message delivery, mail infrastructure, portrait generation, hosting, and development all cost money. Paid identities fund the service. The code remains open source, so you can run it yourself and pay your own infrastructure and provider costs.',
        },
        {
          question: 'What happens when I delete an identity?',
          answer:
            'Deletion starts billing cancellation and removes the mailbox, phone number, profile, vault, and stored wallet records as cleanup completes. A provider failure can leave cancellation or cleanup pending. Export the credentials and wallet recovery material you need before deleting. Accounts registered on other websites remain with those services.',
        },
        {
          question: 'Can I get a refund?',
          answer:
            'Eligible initial purchases have a 14-day refund window. Deleting an eligible card-paid identity initiates a Stripe refund. For a crypto refund, contact us with the active identity ID and a Monero refund address before deleting it. Crypto refunds are manual; renewals are outside the initial-purchase guarantee.',
        },
      ],
    },
  ];
</script>

<svelte:head>
  <title>FAQ | ShadowSelf</title>
  <meta name="description" content="Identity tools, encryption, centralization, providers, self-hosting, payments, and ownership." />
</svelte:head>

<PublicPage title="Frequently asked questions">
  {#each groups as group (group.title)}
    <section class="question-group" aria-label={group.title}>
      <h2>{group.title}</h2>
      {#each group.questions as item (item.question)}
        <details>
          <summary>{item.question}<span aria-hidden="true">+</span></summary>
          <p>{item.answer}</p>
        </details>
      {/each}
    </section>
  {/each}
</PublicPage>

<style>
  .question-group + .question-group {
    margin-top: 44px;
  }
  .question-group h2 {
    margin: 0 0 10px;
    font-size: 18px;
    color: #a99ae9;
  }

  details {
    border-bottom: 1px solid #a5b4fc20;
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    list-style: none;
    padding: 21px 0;
    cursor: pointer;
    color: #dce3f7;
    font-size: 15px;
    line-height: 1.5;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary > span {
    color: #a99ae9;
    font-size: 23px;
    flex-shrink: 0;
    transition: transform 180ms ease;
  }
  details[open] summary > span {
    transform: rotate(45deg);
  }
  details > p {
    font-size: 14px;
    padding-right: 35px;
    padding-bottom: 18px;
  }
  @media (max-width: 600px) {
    summary {
      gap: 18px;
      padding-block: 18px;
    }
    details > p {
      padding-right: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    summary > span {
      transition: none;
    }
  }
</style>
