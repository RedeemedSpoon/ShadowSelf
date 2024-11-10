<script lang="ts">
  import {enhance} from '$app/forms';
  import {SelectMenu} from '$components';
  import type {PageData} from './$types';

  interface Props {
    data: PageData;
  }

  let {data}: Props = $props();
</script>

<svelte:head>
  <title>ShadowSelf - Contact</title>
  <meta name="description" content="Contact us to discuss any questions, concerns, or feedback you may have." />
</svelte:head>

<div id="contact">
  <section>
    <h1 class="basic-style max-md:text-5xl">Contact Us</h1>
    <p class="text-center sm:w-3/4 lg:w-1/2">
      If you have any questions, concerns, or feedback, please don't hesitate to contact us. We look forward to hearing
      from you!
    </p>
  </section>
  <form use:enhance method="POST">
    <label for="subject">Subject</label>
    <input type="text" required placeholder="I am looking for..." name="subject" id="subject" />
    <SelectMenu name="Category" options={data.options} />
    <label for="email">Email (optional)</label>
    <input type="email" placeholder="user@example.com" name="email" id="email" />
    <label for="message">Message</label>
    <textarea name="message" id="message" required placeholder="Your message goes here"></textarea>
    <button type="submit">Submit</button>
  </form>
</div>

<style lang="postcss">
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
</style>
