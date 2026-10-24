<script lang="ts">
  import Select from '$component/ui/Select.svelte';
  import PublicPage from '$component/public/PublicPage.svelte';
  import {CONTACT_CATEGORIES} from '$constant';
  import {enhance} from '$app/forms';
  import type {ActionData} from './$types';

  let {form}: {form: ActionData} = $props();
  let pending = $state(false);
  let category = $derived(form?.values?.category || 'question');
</script>

<svelte:head
  ><title>Contact | ShadowSelf</title><meta
    name="description"
    content="Ask a question, report a bug, or get help with a ShadowSelf account or payment." /></svelte:head>

<PublicPage
  title="Contact"
  description="A question, a bug, or something worth building. Send it here. Include a reply address if you want an answer.">
  <form
    method="POST"
    use:enhance={() => {
      pending = true;
      return async ({update}) => {
        try {
          await update({reset: false});
          document.getElementById('contact-feedback')?.focus();
        } finally {
          pending = false;
        }
      };
    }}>
    {#if form?.error}<div id="contact-feedback" class="feedback error" role="alert" tabindex="-1">
        {form.error}
      </div>{/if}
    {#if form?.success}<div id="contact-feedback" class="feedback success" role="status" tabindex="-1">
        {form.success}
      </div>{/if}
    <div class="form-row">
      <div class="field">
        <label for="subject">Subject</label><input
          id="subject"
          placeholder="A question about my identity"
          name="subject"
          value={form?.values?.subject || ''}
          required
          maxlength="120" />
      </div>
      <div class="field">
        <label for="category">Category</label>
        <Select id="category" name="category" label="Category" options={CONTACT_CATEGORIES} bind:value={category} />
      </div>
    </div>
    <div class="field">
      <label for="email">Email <span>(optional)</span></label><input
        id="email"
        placeholder="you@example.com"
        type="email"
        name="email"
        value={form?.values?.email || ''}
        maxlength="254"
        autocomplete="email"
        aria-describedby="email-help" />
      <p id="email-help" class="field-help">Leave empty to remain anonymous.</p>
    </div>
    <div class="field">
      <label for="message">Message</label><textarea
        id="message"
        placeholder="Tell us what you have in mind. Include any details that might help."
        name="message"
        required
        maxlength="10000"
        rows="7">{form?.values?.message || ''}</textarea>
    </div>
    <div class="submit-row">
      <button class="public-action" type="submit" disabled={pending} aria-busy={pending}
        >{pending ? 'Sending message…' : 'Send message'} <span aria-hidden="true">↗</span></button>
    </div>
  </form>
</PublicPage>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
    margin: 0;
  }
  label {
    display: block;
    color: #d1daf0;
    font-size: 13px;
    margin: 0;
  }
  label > span {
    color: #74819f;
    font-size: 12px;
    margin-left: 4px;
  }
  textarea {
    min-height: 190px;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 20px;
  }
  .field-help {
    font-size: 12px;
    margin: 0 !important;
    color: #8593b3;
  }
  .feedback {
    padding: 17px 20px;
    border-radius: 7px;
    line-height: 1.7;
    font-size: 13px;
  }
  .error {
    background: #f8717110;
    border: 1px solid #f8717135;
    color: #fda4af;
  }
  .success {
    background: #34d39910;
    border: 1px solid #34d39935;
    color: #9ce4cc;
  }
  .submit-row {
    display: flex;
    align-items: center;
    margin-top: 4px;
  }
  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }
</style>
