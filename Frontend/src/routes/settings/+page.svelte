<script lang="ts">
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';

  let {data}: {data: PageData} = $props();

  let list: HTMLElement;
  const sections = data.settings.map((item) => {
    return {
      title: item,
      id: item.toLowerCase().split(' ').join('-'),
    };
  });

  function handleClick(index: number) {
    const array = Array.from(list.children);
    array.forEach((item) => item.classList.remove('!bg-neutral-300/10', 'border-l-4', '!pl-24'));
    array[index + 1].classList.add('!bg-neutral-300/10', 'border-l-4', '!pl-24');
  }
</script>

<svelte:head>
  <title>ShadowSelf - Settings</title>
  <meta name="description" content="Change your account settings here and keep yourself secure" />
</svelte:head>

<div id="settings">
  <ul bind:this={list} class="flex flex-col bg-neutral-800/40 pt-24 max-lg:hidden">
    <li id="title">Sections</li>
    {#each sections as section, i}
      <a onclick={() => handleClick(i)} href="#{section.id}" style="top: {(i + 3.25) * 4}rem"><li>{section.title}</li></a>
    {/each}
  </ul>
  <section class="flex h-full w-full flex-col gap-8 px-24 pt-20">
    <h1 class="basic-style text-5xl font-bold">Account Settings</h1>
    <p class="-mt-6">Change your account settings here and keep yourself secure</p>
    <h2 id={sections[0].id}>{sections[0].title}</h2>
    <p>description</p>
    <form use:enhance method="POST" action="?/username">
      <label for="username">Username</label>
      <input name="username" type="text" placeholder="Username" />
      <button type="submit">Update</button>
    </form>
    <form use:enhance method="POST" action="?/username">
      <label for="oldPassword">Old Password</label>
      <input name="oldPassword" type="password" placeholder="Old Password" />
      <label for="newPassword">New Password</label>
      <input name="newPassword" type="password" placeholder="New Password" />
      <button type="submit">Change Password</button>
    </form>
    <hr />
    <h2 id={sections[1].id}>{sections[1].title}</h2>
    <p>description</p>
    <button>Change 2FA</button>
    <button>Remove/Add 2FA</button>
    <label for="recovery">Recovery Codes</label>
    <div class="grid grid-cols-2 place-items-center gap-6 rounded-xl bg-neutral-800/50 p-8 font-mono font-medium tracking-wider">
      <p>456789123</p>
      <p>456789123</p>
      <p>456789123</p>
      <p>456789123</p>
      <p>456789123</p>
      <p>456789123</p>
    </div>
    <button>Generate New Recovery Codes</button>
    <hr />
    <h2 id={sections[2].id}>{sections[2].title}</h2>
    <p>description</p>
    <button>Enable/Disable API Access</button>
    <p>4f8re64g6z84aefbkezf86qsc4ze8f4zezfze86zhzui48b682buokhpodercg35az9d5</p>
    <form use:enhance method="POST" action="?/api">
      <button>Generate New API Key</button>
    </form>
    <hr />
    <h2 id={sections[3].id}>{sections[3].title}</h2>
    <p>description</p>
    <form use:enhance method="POST" action="?/billing">
      <label for="billing">Billing 1</label>
      <input name="billing" type="text" placeholder="Billing" />
      <label for="billing">Billing 2</label>
      <input name="billing" type="text" placeholder="Billing" />
      <label for="billing">Billing 3</label>
      <input name="billing" type="text" placeholder="Billing" />
      <label for="billing">Billing 4</label>
      <input name="billing" type="text" placeholder="Billing" />
      <button type="submit">Update</button>
    </form>
    <hr />
    <h2 id={sections[4].id}>{sections[4].title}</h2>
    <p>description</p>
    <form use:enhance method="POST" action="?/danger">
      <label for="danger">Danger Zone</label>
      <button>Logout</button>
      <button>Revoke All Session</button>
      <label for="danger">Danger Zone</label>
      <button>Delete Account</button>
    </form>
  </section>
</div>

<style lang="postcss">
  #settings {
    @apply grid h-full min-h-screen w-full grid-cols-[1fr_3fr] pt-[5rem] text-neutral-400;
  }

  h2 {
    @apply scroll-m-[12rem] text-3xl text-neutral-300;
  }

  #title {
    @apply sticky top-36 py-3 pl-16 text-4xl font-semibold text-neutral-100;
  }

  a {
    @apply sticky py-3 pl-20 text-neutral-300 transition-all duration-200 ease-in-out;
    @apply border-neutral-300 hover:bg-neutral-300/5 hover:text-neutral-300;
  }

  form {
    @apply flex flex-col gap-4;
  }

  label {
    @apply ml-2 text-neutral-300;
  }
</style>
