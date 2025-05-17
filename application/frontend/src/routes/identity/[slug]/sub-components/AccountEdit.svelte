<script lang="ts">
  import {KeyIcon, UserIcon, KeylockIcon, WWWIcon, RepeatIcon, EyeIcon} from '$icon';
  import {ActionIcon, LoadingButton, InputWithIcon, SelectMenu} from '$component';
  import type {Account, APIResponse} from '$type';
  import type {Writable} from 'svelte/store';
  import {fetchIndex} from '$store';
  import {encrypt} from '$crypto';
  import {fetchAPI} from '$fetch';
  import {notify} from '$lib';

  interface Props {
    mode: Writable<'view' | 'add' | 'edit'>;
    target: Writable<Account | null>;
    accounts: Writable<APIResponse>;
  }

  let {accounts, target, mode}: Props = $props();
  let showPassword = $state(false) as boolean;

  async function generatePassword() {
    const password = window.crypto.getRandomValues(new BigUint64Array(1))[0].toString(36);
    const element = document.querySelector('input[name="password"]') as HTMLInputElement;
    element.value = password;
  }

  async function addOrUpdateAccount() {
    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 650));

    const username = (document.querySelector('input[name="username"]') as HTMLInputElement)?.value;
    const rawPassword = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
    const website = (document.querySelector('input[name="website"]') as HTMLInputElement)?.value;
    const rawTotp = (document.querySelector('input[name="totp"]') as HTMLInputElement)?.value;
    const algorithm = (document.querySelector('input[name="algorithm"]') as HTMLInputElement)?.value.toUpperCase();

    if (!username || !rawPassword) {
      notify('Username and Password are required', 'alert');
      $fetchIndex = 0;
    }

    const password = await encrypt(rawPassword);
    const totp = rawTotp ? await encrypt(rawTotp) : null;
    const id = $mode === 'edit' ? $target!.id : null;
    const body = {id, username, password, website, totp, algorithm};

    if ($mode === 'add') {
      const response = await fetchAPI('account/add-account', 'POST', body);
      if (response.err) return notify(response.err, 'alert');

      $accounts.accounts.push(response as unknown as Account);
      $mode = 'view';
      $fetchIndex = 0;
      $target = null;
    } else {
      const response = await fetchAPI('account/edit-account', 'PUT', body);
      if (response.err) return notify(response.err, 'alert');

      const otherAccounts = $accounts.accounts.filter((account) => account.id !== (response.id as unknown));
      $accounts.accounts = [...otherAccounts, response] as unknown as APIResponse['accounts'];
      $mode = 'view';
      $fetchIndex = 0;
      $target = null;
    }
  }
</script>

{#if $mode === 'add' || $mode === 'edit'}
  <section class="flex flex-col items-center gap-8 p-8">
    <div class="flex gap-8 max-lg:flex-col">
      <div class="flex flex-col gap-2">
        <label for="username">Username<span class="text-red-600">*</span></label>
        <InputWithIcon type="text" name="username" placeholder="Username" icon={UserIcon} />

        <div class="flex justify-between gap-4">
          <label for="password">Password<span class="text-red-600">*</span></label>
          <div class="mt-2 flex gap-1">
            <ActionIcon title="Regenerate Random Password" icon={RepeatIcon} action={generatePassword} size="small" />
            <ActionIcon
              title="Show Password"
              icon={EyeIcon}
              {showPassword}
              action={() => (showPassword = !showPassword)}
              size="small" />
          </div>
        </div>
        <InputWithIcon type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" icon={KeyIcon} />

        <label for="website">Website</label>
        <InputWithIcon type="url" name="website" placeholder="Website URL" icon={WWWIcon} />
      </div>
      <div class="flex flex-col gap-2">
        <label for="totp">Totp Secret</label>
        <InputWithIcon type="text" name="totp" placeholder="Totp Secret" icon={KeylockIcon} />

        <label for="algorithm">Algorithm</label>
        <SelectMenu options={['SHA1', 'SHA256', 'SHA512']} name="algorithm" value={$target?.algorithm} />
        <p>* Required Fields</p>
      </div>
    </div>

    <LoadingButton onclick={addOrUpdateAccount}>
      {$mode === 'add' ? 'Add' : 'Update'} Account
    </LoadingButton>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  label {
    @apply ml-2 mt-2 text-neutral-300;
  }
</style>
