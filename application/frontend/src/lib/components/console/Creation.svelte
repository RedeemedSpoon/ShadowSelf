<script lang="ts">
  import {untrack, onDestroy} from 'svelte';
  import {goto, invalidateAll} from '$app/navigation';
  import {request} from '$utils/webfetch';
  import {ETHNICITIES, MAIL_DOMAIN} from '$constant';
  import type {CryptoKeys, InformationAPI} from '$type';
  import type {CreationData} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Copy from '$component/ui/Copy.svelte';

  let {data}: {data: CreationData} = $props();

  type Profile = {name: string; bio: string; picture: string; age: number; sex: string; ethnicity: string};

  type Wallet = {blob: string; keys: CryptoKeys};

  let generationEpoch = 0;
  let step = $state(1);
  let pending = $state(false);
  let error = $state('');
  let noticeDismissed = $state(false);
  let phones = $state<string[]>([]);
  let location = $state('');
  let profile = $state<Profile>({name: '', bio: '', picture: '', age: 28, sex: 'male', ethnicity: ETHNICITIES[0]});
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmation = $state('');
  let phrase = $state('');
  let moneroPhrase = $state('');
  let saved = $state(false);
  let wallet = $state<Wallet | null>(null);
  const stages = [
    {label: 'Profile location', feature: 'identity'},
    {label: 'Profile', feature: 'identity'},
    {label: 'Email', feature: 'email'},
    {label: 'Phone', feature: 'phone'},
    {label: 'Wallet', feature: 'wallet'},
    {label: 'Review', feature: 'identity'},
  ];
  const path = $derived(`/identities/${data.id}/creation`);

  $effect(() => {
    const current = data;
    untrack(() => {
      generationEpoch++;
      password = '';
      confirmation = '';
      phrase = '';
      moneroPhrase = '';
      saved = false;
      phones = [];
      error = '';
      pending = false;

      const draft = current.creation?.draft;

      if (!draft) {
        return;
      }

      location = String(draft.location || '');
      profile = (draft.profile as Profile) || {
        name: '',
        bio: '',
        picture: '',
        age: 28,
        sex: 'male',
        ethnicity: ETHNICITIES[0],
      };
      email = String(draft.email || '');
      phone = String(draft.phone || '');
      wallet = (draft.wallet as Wallet) || null;
      step =
        current.creation?.creationStatus === 'provisioning' || wallet
          ? 6
          : phone
            ? 5
            : email
              ? 4
              : profile.name
                ? 3
                : location
                  ? 2
                  : 1;
    });
  });

  onDestroy(() => {
    generationEpoch++;
    password = '';
    confirmation = '';
    phrase = '';
    moneroPhrase = '';
    wallet = null;
  });

  async function save(body: Record<string, unknown>) {
    const result = await request(path, 'PUT', body);

    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  async function generate(kind?: 'name' | 'bio' | 'picture') {
    pending = true;
    error = '';

    try {
      const result = await request<{identity?: Profile; repeat?: InformationAPI}>(`${path}/profile`, 'POST', {
        location,
        ...(kind === 'picture' ? {regenerate: profile} : kind ? {repeat: {[kind]: true, sex: profile.sex}} : {}),
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      profile = {...profile, ...result.data.identity, ...result.data.repeat};
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not generate this profile.';
    } finally {
      pending = false;
    }
  }

  async function continueSetup(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';

    try {
      if (step === 1) {
        await save({location});
        await generate();

        if (!profile.name) {
          return;
        }
      }

      if (step === 2) {
        await save({profile});

        const result = await request<{email: string}>(`${path}/email`, 'POST', {profile});

        if (!result.ok) {
          throw new Error(result.error);
        }

        email = `${result.data.email}@${MAIL_DOMAIN}`;
      }

      if (step === 3) {
        await save({email});
        await findPhones();
      }

      if (step === 4) {
        await save({phone});
      }

      if (step === 5) {
        if (!wallet || !saved) {
          throw new Error('Generate and save your recovery phrase first.');
        }

        await save({wallet});
        password = '';
        confirmation = '';
        phrase = '';
        moneroPhrase = '';
      }

      if (step === 6) {
        const result = await request(`${path}/provision`, 'POST', {});

        if (!result.ok) {
          throw new Error(result.error);
        }

        await goto(`/identity/${data.id}`);

        return;
      }

      step++;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not save this step. Retry when ready.';
    } finally {
      pending = false;
    }
  }

  async function findPhones() {
    const result = await request<{phone: string[]}>(`${path}/phones`, 'POST', {email, location});

    if (!result.ok) {
      throw new Error(result.error);
    }

    phones = result.data.phone;
    phone = phones[0] || '';
  }

  async function refreshPhones() {
    pending = true;
    error = '';

    try {
      await findPhones();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'No numbers available.';
    } finally {
      pending = false;
    }
  }

  async function generateWallet() {
    pending = true;
    error = '';

    const epoch = generationEpoch;
    const identityID = data.id;
    const candidate = password;

    try {
      if (candidate.length < 12 || candidate !== confirmation) {
        throw new Error('Use at least 12 characters and matching master passwords.');
      }

      const [{generateMnemonic, mnemonicToSeed}, {wordlist}, {HDKey}, {mnemonicToAccount}, {deriveMasterKey, encrypt}] =
        await Promise.all([
          import('@scure/bip39'),
          import('@scure/bip39/wordlists/english.js'),
          import('@scure/bip32'),
          import('viem/accounts'),
          import('$utils/cryptography'),
        ]);
      const key = await deriveMasterKey(candidate, identityID);

      const mnemonic = generateMnemonic(wordlist, 256);
      const seed = await mnemonicToSeed(mnemonic);

      const root = HDKey.fromMasterSeed(seed);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(seed)));

      const scalar =
        BigInt(
          `0x${Array.from(digest)
            .reverse()
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('')}`,
        ) %
        (2n ** 252n + 27742317777372353535851937790883648493n);
      const spendKey = scalar.toString(16).padStart(64, '0').match(/../g)!.reverse().join('');
      const monero = await import('monero-ts');
      monero.LibraryUtils.setWorkerDistPath(new URL('/monero.worker.js', locationOrigin()).href);

      const xmr = await monero.createWalletFull({
        networkType: monero.MoneroNetworkType.MAINNET,
        privateSpendKey: spendKey,
        password: crypto.randomUUID(),
      });

      try {
        const generated = {
          blob: await encrypt(mnemonic, key),
          keys: {
            btc: root.derive("m/84'/0'/0'").publicExtendedKey,
            ltc: root.derive("m/84'/2'/0'").publicExtendedKey,
            evm: mnemonicToAccount(mnemonic).address,
            xmr: {
              address: await encrypt(await xmr.getPrimaryAddress(), key),
              viewKey: await encrypt(await xmr.getPrivateViewKey(), key),
              spendKey: await encrypt(await xmr.getPrivateSpendKey(), key),
            },
          },
        };
        if (epoch !== generationEpoch || data.id !== identityID) {
          return;
        }

        const moneroSeed = await xmr.getSeed();

        if (epoch !== generationEpoch || data.id !== identityID) {
          return;
        }

        wallet = generated;
        phrase = mnemonic;
        moneroPhrase = moneroSeed;
        saved = false;
      } finally {
        await xmr.close();
      }
    } catch (cause) {
      if (epoch === generationEpoch) {
        error = cause instanceof Error ? cause.message : 'Wallet generation failed. Retry without leaving this page.';
      }
    } finally {
      if (epoch === generationEpoch) {
        pending = false;
      }
    }
  }

  function locationOrigin() {
    return window.location.origin;
  }
</script>

<svelte:head><title>Set up identity | ShadowSelf</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Set up identity</h1>
  </div>
  <a class="control-button quiet" href="/dashboard">Back to identities</a>
</div>
<div class="creation-flow">
  {#if !data.creation}<Status message={data.loadError} kind="error" /><Button
      variant="secondary"
      onclick={() => invalidateAll()}>Retry setup</Button
    >{:else}
    {#if !noticeDismissed}
      <Status
        message="Setup cannot be completed while replacement phone and network providers are being configured. Your draft can still be edited."
        ondismiss={() => (noticeDismissed = true)} />
    {/if}
    <ol class="creation-progress">
      {#each stages as stage, index (stage.label)}<li
          data-feature={stage.feature}
          class:current={step === index + 1}
          class:complete={step > index + 1}>
          <span>{step > index + 1 ? '✓' : String(index + 1).padStart(2, '0')}</span>{stage.label}
        </li>{/each}
    </ol>
    <section class="panel creation-panel" data-feature={stages[step - 1].feature}>
      <div class="section-heading">
        <div>
          <h2>{stages[step - 1].label}</h2>
          {#if step === 5}<p>Master passwords cannot be recovered.</p>{/if}
        </div>
      </div>
      <Status message={error} kind="error" />
      <form onsubmit={continueSetup}>
        {#if step === 1}
          <div class="field">
            <label for="profile-location">Profile location</label>
            <input id="profile-location" bind:value={location} maxlength="120" placeholder="City or region" required />
            <small>This describes the profile. Network access will depend on the configured provider.</small>
          </div>
        {:else if step === 2}<div class="creation-profile">
            {#if profile.picture}<img
                src="data:image/png;base64,{profile.picture}"
                alt="Generated identity portrait" />{/if}
            <div class="button-row">
              <Button type="button" variant="secondary" loading={pending} onclick={() => generate('picture')}
                >Generate portrait</Button
              ><Button type="button" variant="quiet" disabled={pending} onclick={() => generate('name')}
                >Generate name</Button
              ><Button type="button" variant="quiet" disabled={pending} onclick={() => generate('bio')}
                >Generate bio</Button>
            </div>
          </div>
          <div class="form-grid">
            <div class="field wide">
              <label for="create-name">Name</label><input
                id="create-name"
                bind:value={profile.name}
                required
                minlength="2"
                maxlength="30" />
            </div>
            <div class="field">
              <label for="create-age">Age</label><input
                id="create-age"
                type="number"
                min="18"
                max="60"
                bind:value={profile.age}
                required />
            </div>
            <div class="field">
              <label for="create-sex">Sex</label><select id="create-sex" bind:value={profile.sex}
                ><option value="male">Male</option><option value="female">Female</option></select>
            </div>
            <div class="field wide">
              <label for="create-ethnicity">Ethnicity</label><select
                id="create-ethnicity"
                bind:value={profile.ethnicity}
                >{#each ETHNICITIES as ethnicity (ethnicity)}<option value={ethnicity}
                    >{ethnicity[0].toUpperCase() + ethnicity.slice(1)}</option
                  >{/each}</select>
            </div>
            <div class="field wide">
              <label for="create-bio">Bio</label><textarea
                id="create-bio"
                bind:value={profile.bio}
                minlength="5"
                maxlength="126"></textarea>
            </div>
          </div>
        {:else if step === 3}<div class="field">
            <label for="create-email">Mailbox address</label><input
              id="create-email"
              type="email"
              bind:value={email}
              pattern={`[^@]+@${MAIL_DOMAIN.replaceAll('.', '\\.')}`}
              required /><small>Addresses use the {MAIL_DOMAIN} domain.</small>
          </div>
        {:else if step === 4}<div class="field">
            <label for="create-phone">Phone number</label><select id="create-phone" bind:value={phone} required
              >{#if phone && !phones.includes(phone)}<option>{phone}</option
                >{/if}{#each phones as number (number)}<option>{number}</option>{/each}</select>
          </div>
          <Button type="button" variant="secondary" loading={pending} onclick={refreshPhones}
            >Load available numbers</Button>
        {:else if step === 5}<Status
            message="Your account password does not unlock this wallet. This master password encrypts the vault and wallet in your browser." />{#if !wallet}<div
              class="form-grid">
              <div class="field">
                <label for="create-master">Master password</label><input
                  id="create-master"
                  type="password"
                  minlength="12"
                  bind:value={password}
                  autocomplete="new-password"
                  required />
              </div>
              <div class="field">
                <label for="create-confirm">Confirm master password</label><input
                  id="create-confirm"
                  type="password"
                  bind:value={confirmation}
                  autocomplete="new-password"
                  required />
              </div>
            </div>
            <Button type="button" loading={pending} icon="key" onclick={generateWallet}
              >Generate encrypted wallet</Button
            >{:else}{#if phrase}<p>Bitcoin, Litecoin, Ethereum and USDT recovery phrase</p>
              <Copy value={phrase} label="Copy recovery phrase" />
              <p>Monero recovery phrase. Restore this phrase in a Monero wallet.</p>
              <Copy value={moneroPhrase} label="Copy Monero recovery phrase" />{:else}<Status
                message="This wallet draft is already encrypted. Use your saved recovery phrase and master password; the phrase is not kept after leaving this step." />{/if}<label
              class="backup-confirm"
              ><input type="checkbox" bind:checked={saved} required /> I saved both recovery phrases and the master password
              securely.</label
            >{/if}
        {:else}<dl class="data-list">
            <div>
              <dt>Name</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>Profile location</dt>
              <dd>{location}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{phone}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>Encrypted locally</dd>
            </div>
          </dl>
          <Status
            message="Provisioning creates the mailbox and reserves the phone number. Provider failures retain this draft for retry." />{/if}
        <div class="button-row creation-actions">
          {#if step > 1 && data.creation.creationStatus !== 'provisioning'}<Button
              type="button"
              variant="quiet"
              disabled={pending}
              onclick={() => {
                step--;
                error = '';
              }}>Back</Button
            >{/if}<Button
            type="submit"
            loading={pending}
            disabled={step === 5 && (!wallet || !saved)}
            icon={step === 6 ? 'check' : 'arrow'}>{step === 6 ? 'Provision identity' : 'Save and continue'}</Button>
        </div>
      </form>
    </section>{/if}
</div>

<style>
  .creation-flow {
    width: min(850px, 100%);
    margin-inline: auto;
  }
  .creation-progress li[data-feature] {
    color: var(--feature-accent);
  }
  .creation-progress li[data-feature] span {
    border-color: color-mix(in srgb, var(--feature-accent) 50%, transparent);
    color: var(--feature-accent);
  }
  .creation-progress {
    list-style: none;
    display: flex;
    padding: 0;
    margin: 0 0 25px;
    gap: 15px;
    overflow-x: auto;
  }
  .creation-progress li {
    font-size: 11px;
    color: #64738d;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .creation-progress li span {
    border: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
    border-radius: 5px;
    padding: 5px 7px;
    font-family: monospace;
  }
  .creation-progress li.current {
    color: var(--accent-light);
  }
  .creation-progress li.current span {
    background: color-mix(in srgb, var(--accent-strong) 13.33%, transparent);
    border-color: #a592ff50;
  }
  .creation-progress li.complete {
    color: #83baa9;
  }
  .creation-actions {
    justify-content: flex-end;
    margin-top: 25px;
  }
  .creation-profile {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
  }
  .creation-profile img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 6px;
  }
  .backup-confirm {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 20px;
  }
  @media (max-width: 600px) {
    .creation-profile {
      flex-wrap: wrap;
    }
    .creation-progress li[data-feature] {
      color: var(--feature-accent);
    }
    .creation-progress li[data-feature] span {
      border-color: color-mix(in srgb, var(--feature-accent) 50%, transparent);
      color: var(--feature-accent);
    }
    .creation-progress {
      gap: 10px;
    }
  }
</style>
