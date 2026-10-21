<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
  import {CRYPTO_DISCOUNT, PRICING_TIERS} from '$constant';

  let expanded = $state<string[]>([]);

  function toggleQuestion(question: string) {
    expanded = expanded.includes(question) ? expanded.filter((value) => value !== question) : [...expanded, question];
  }

  const groups = [
    {
      title: 'Start here',
      questions: [
        {
          question: 'What is an identity here?',
          answer:
            'A separate online persona with a name, profile, and its own tools. Think of a pen name with an inbox, a phone number, and a vault for the accounts it owns. It is a synthetic profile, not a stolen identity or an official document.',
        },
        {
          question: 'Why would I need one?',
          answer:
            "Because a forum, a public project, and a shop don't all need your everyday contact details. Use an identity when you want to take part without attaching the activity to your personal name or filling your main inbox with it.",
        },
        {
          question: 'Why not just make another email address?',
          answer:
            'That works for some things. ShadowSelf is for the rest: the phone verification, the password you need six months later, the recovery codes, the files, and the payment tools. They stay together under the profile that uses them.',
        },
        {
          question: 'What comes with an identity?',
          answer:
            'A customizable profile and pictures, account vault, email with aliases and PGP, mobile number, crypto wallets, virtual card, residential routing, and online drive. Privacy utilities help prepare files and check what you share. Provider availability and requirements still apply.',
        },
        {
          question: 'How do I get started?',
          answer:
            "Create an account, choose a plan, then create an identity. Review its profile and contact details before you use them on another website. Save that website's login in the identity's vault so you can find it again.",
        },
        {
          question: 'Can I change the profile?',
          answer:
            'Yes. Edit the name, biography, location, and pictures. Keep track of details you have already given to other services, especially if they use them for recovery. Changing a profile here does not change an account on another website.',
        },
      ],
    },
    {
      title: 'Privacy, without the fairy tales',
      questions: [
        {
          question: 'Does this make me untraceable?',
          answer:
            'No. A separate name and inbox reduce what you hand over, but shared cookies, fingerprints, IP addresses, payments, and your own habits can connect accounts. Residential routing changes the exit IP. It does not erase every other clue.',
        },
        {
          question: 'What can ShadowSelf see?',
          answer:
            'The server handles profiles, mail, SMS, account metadata, and billing records. Your browser encrypts vault passwords, TOTP secrets, and wallet signing keys before storage. Your master password stays on your device. PGP protects mail you encrypt with it; ordinary mail is outside vault encryption.',
        },
        {
          question: 'What happens if I forget the master password?',
          answer:
            'You can recover access to your account, but that does not unlock encrypted vault or wallet secrets. We do not have your master password to reset. Keep your wallet recovery material somewhere safe outside the vault.',
        },
        {
          question: 'Will every website accept these details?',
          answer:
            'No. Some websites reject certain phone numbers or email domains, and a synthetic profile cannot satisfy an official identity check. Test a number before making it your only account-recovery method.',
        },
        {
          question: "Won't people misuse this?",
          answer:
            'Yes. The same separation that helps someone speak privately can help someone behave badly. Requiring everyone to expose their real name is not a solution I want to build. There is still a hard boundary: spam, phishing, fraud, and attacks burn domains, numbers, and provider access for everyone else. We suspend accounts that do that. Privacy is the purpose of the tool, not an exemption from responsibility.',
        },
        {
          question: 'Can I inspect the code or run it myself?',
          answer:
            'Yes. The website, backend, and extension are open source under AGPL-3.0. The README covers local setup. Self-hosting means supplying your own infrastructure and accounts for the providers you enable.',
        },
      ],
    },
    {
      title: 'Using the tools',
      questions: [
        {
          question: 'What does the browser extension do?',
          answer:
            "Connect it to a signed-in ShadowSelf tab to find and open identities while browsing. Use residential routing with the identity's connection settings. Browser cookies and fingerprints need their own controls.",
        },
        {
          question: 'Can I use my own client?',
          answer:
            'Enable API access in settings and generate a key. The API reference shows request bodies, authentication, and error responses. Your client must encrypt vault secrets and sign wallet transfers locally, just as the browser does.',
        },
        {
          question: 'Which cryptocurrencies are supported?',
          answer:
            'Bitcoin, Litecoin, Ethereum, USDT on Ethereum, and Monero. Check the asset and network before sending. Public blockchain activity is visible even when the wallet belongs to a synthetic identity.',
        },
        {
          question: 'Who runs the services behind an identity?',
          answer:
            'Mail, mobile numbers, residential routing, card payments, and other services rely on configured providers. They receive the information needed to do their job. The privacy policy explains those data flows. A single workspace does not mean there are no third parties.',
        },
      ],
    },
    {
      title: 'Cost and ownership',
      questions: [
        {
          question: 'How much does it cost?',
          answer: `$${PRICING_TIERS.monthly.price} monthly, $${PRICING_TIERS.annually.price} annually, or $${PRICING_TIERS.lifetime.price} for lifetime access per identity. Cryptocurrency payments receive a ${CRYPTO_DISCOUNT}% discount. Card subscriptions renew automatically; crypto renewals are manual.`,
        },
        {
          question: 'Why charge for it?',
          answer:
            'The number, inbox, storage, and provider calls have bills attached. Charging for identities pays those bills and the work on the project. The source stays public if you would rather run the services yourself.',
        },
        {
          question: 'What does deleting an identity remove?',
          answer:
            'Its stored profile, vault, messages, and wallet records, plus the associated service resources as cleanup completes. It also starts billing cancellation. It does not delete accounts you registered on other websites. Export what you need first; provider failures can delay cleanup.',
        },
        {
          question: 'Can I get a refund?',
          answer:
            'Eligible initial purchases have a 14-day window. Delete an eligible identity to initiate its refund. Crypto purchases require an external XMR refund address and are refunded automatically at their original USD purchase value, converted when the payout is signed. ShadowSelf pays the outgoing network fee. The refund policy has the details.',
        },
      ],
    },
  ];
</script>

<svelte:head>
  <title>FAQ | ShadowSelf</title>
  <meta
    name="description"
    content="Identity tools, encryption, centralization, providers, self-hosting, payments, and ownership." />
</svelte:head>

<PublicPage title="Frequently asked questions" centered>
  {#each groups as group, groupIndex (group.title)}
    <section class="question-group" aria-label={group.title}>
      <h2>{group.title}</h2>
      {#each group.questions as item, index (item.question)}
        {@const open = expanded.includes(item.question)}
        {@const id = `question-${groupIndex}-${index}`}
        <article class:open>
          <button
            type="button"
            {id}
            aria-expanded={open}
            aria-controls={`${id}-answer`}
            onclick={() => toggleQuestion(item.question)}>
            {item.question}<span aria-hidden="true">+</span>
          </button>
          <div class="answer" id={`${id}-answer`} role="region" aria-labelledby={id} inert={!open}>
            <div><p>{item.answer}</p></div>
          </div>
        </article>
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

  article {
    border-bottom: 1px solid #a5b4fc20;
  }
  article:last-child {
    border-bottom: 0;
  }
  .answer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 380ms ease;
  }
  .answer > div {
    overflow: hidden;
  }
  article.open .answer {
    grid-template-rows: 1fr;
  }
  .answer p {
    opacity: 0;
    transform: translateY(-8px);
    transition:
      opacity 280ms ease,
      transform 380ms ease;
    margin: 0;
  }
  article.open .answer p {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 70ms;
  }
  article > button {
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    font-family: inherit;
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
  article > button > span {
    color: #a99ae9;
    font-size: 23px;
    flex-shrink: 0;
    transition: transform 180ms ease;
  }
  article.open > button > span {
    transform: rotate(45deg);
  }
  .answer p {
    font-size: 14px;
    padding-right: 35px;
    padding-bottom: 18px;
  }
  @media (max-width: 600px) {
    article > button {
      gap: 18px;
      padding-block: 18px;
    }
    .answer p {
      padding-right: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .answer,
    .answer p {
      transition: none;
    }
    .answer p {
      transform: none;
    }
    article > button > span {
      transition: none;
    }
  }
</style>
