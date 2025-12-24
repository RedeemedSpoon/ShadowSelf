<script lang="ts">
  import {SelectMenu, LoadingButton} from '$component';
  import type {Notification} from '$type';
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {fetchIndex} from '$store';
  import {notify} from '$lib';

  interface Props {
    data: PageData;
    form: Notification;
  }

  let {data, form}: Props = $props();

  $effect(() => {
    if (form?.message) notify(form.message, form.type);
  });

  async function handleForm() {
    fetchIndex.set(1);
    await new Promise((resolve) => setTimeout(resolve, 750));

    // @ts-expect-error TS2322
    return async ({update, result}) => {
      fetchIndex.set(0);
      if (result.data.type && result.data.type === 'success') update({reset: true});
      update({reset: false});
    };
  }
</script>

<svelte:head>
  <title>ShadowSelf - Contact</title>
  <meta name="description" content="Contact us to discuss any questions, concerns, or feedback you may have." />
</svelte:head>

<div id="contact">
  <section>
    <h1 class="basic-style max-md:text-5xl">Contact Us</h1>
    <p class="text-center sm:w-3/4 lg:w-1/2">
      If you have any questions, concerns, or feedback, please don't hesitate to contact us. We look forward to hearing from you!
    </p>
  </section>
  <form use:enhance={handleForm} method="POST">
    <label for="subject">Subject</label>
    <input type="text" required placeholder="I am looking for..." name="subject" id="subject" />

    <label for="category">Category</label>
    <SelectMenu name="Category" options={data.contactOptions} />

    <label for="email">Email (optional)</label>
    <input type="email" placeholder="user@example.com" name="email" id="email" />

    <label for="message">Message</label>
    <textarea name="message" id="message" required placeholder="Your message goes here"></textarea>

    <LoadingButton>Submit</LoadingButton>
  </form>
</div>

<style lang="postcss">
  @reference "$style";

  #contact {
    @apply mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-12 md:w-3/4 xl:w-2/3;
  }

  section {
    @apply flex flex-col items-center gap-4;
  }

  textarea {
    @apply mb-6 h-[25rem] resize-none;
  }

  form {
    @apply flex flex-col gap-4;
  }

  label {
    @apply mt-4 ml-2;
  }
</style>
