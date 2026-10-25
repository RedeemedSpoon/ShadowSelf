<script lang="ts">
  import Select from '$component/ui/Select.svelte';
  import {untrack} from 'svelte';
  import type {FullIdentity, InformationAPI} from '$type';
  import {request} from '$utils/webfetch';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import {ETHNICITIES, SEX_OPTIONS} from '$constant';

  let {account, onupdate}: {account: FullIdentity; onupdate: (patch: Partial<FullIdentity>) => void} = $props();
  let editing = $state(false);
  let pending = $state('');
  let error = $state('');
  let profile = $state(
    untrack(() => ({
      name: account.name,
      bio: account.bio,
      age: account.age,
      sex: account.sex,
      ethnicity: account.ethnicity,
    })),
  );

  async function save(event: SubmitEvent) {
    event.preventDefault();
    pending = 'save';
    error = '';

    const result = await request<InformationAPI>(`/identities/${account.id}/profile`, 'PATCH', profile);
    pending = '';

    if (!result.ok) {
      error = result.error;

      return;
    }

    onupdate(profile);
    editing = false;
  }

  async function regenerate(kind: 'name' | 'bio' | 'picture') {
    pending = kind;
    error = '';

    const result = await request<InformationAPI>(`/identities/${account.id}/profile/${kind}`, 'POST', profile);
    pending = '';

    if (!result.ok) {
      error = result.error;

      return;
    }

    onupdate(result.data);
    profile = {...profile, ...result.data};
  }
</script>

<div class="section-heading">
  <div>
    <h2>Identity information</h2>
  </div>
  <Button variant="secondary" icon="edit" onclick={() => (editing = !editing)}
    >{editing ? 'Cancel editing' : 'Edit profile'}</Button>
</div>
<Status message={error} kind="error" />
<div class="profile-grid">
  <section class="panel portrait-panel">
    {#if account.picture}<img
        class="portrait"
        src="data:image/png;base64,{account.picture}"
        alt="Portrait of {account.name}" />{:else}<div class="portrait empty-state">No portrait</div>{/if}<Button
      variant="secondary"
      icon="refresh"
      loading={pending === 'picture'}
      disabled={!!pending}
      onclick={() => regenerate('picture')}>Generate portrait</Button>
  </section>
  <section class="panel">
    {#if editing}<form onsubmit={save}>
        <div class="form-grid">
          <div class="field wide">
            <label for="profile-name">Name</label><input
              id="profile-name"
              placeholder="Hugo Laurent"
              bind:value={profile.name}
              required
              minlength="2"
              maxlength="30" />
          </div>
          <div class="field">
            <label for="profile-age">Age</label><input
              id="profile-age"
              placeholder="28"
              type="number"
              min="18"
              max="60"
              bind:value={profile.age}
              required />
          </div>
          <div class="field">
            <label for="profile-sex">Sex</label><Select
              id="profile-sex"
              label="Sex"
              options={SEX_OPTIONS}
              bind:value={profile.sex} />
          </div>
          <div class="field wide">
            <label for="profile-ethnicity">Ethnicity</label><Select
              id="profile-ethnicity"
              label="Ethnicity"
              options={ETHNICITIES.map((value) => ({value, label: value[0].toUpperCase() + value.slice(1)}))}
              bind:value={profile.ethnicity} />
          </div>
          <div class="field wide">
            <label for="profile-bio">Bio</label><textarea
              id="profile-bio"
              placeholder="An illustrator in Amsterdam with a soft spot for old synths."
              bind:value={profile.bio}
              minlength="5"
              maxlength="126"></textarea>
          </div>
        </div>
        <Button type="submit" loading={pending === 'save'}>Save profile</Button>
      </form>
    {:else}<dl class="data-list">
        <div>
          <dt>Name</dt>
          <dd><Copy value={account.name} /></dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{account.location}</dd>
        </div>
        <div>
          <dt>Age / sex</dt>
          <dd>{account.age} / {account.sex}</dd>
        </div>
        <div>
          <dt>Ethnicity</dt>
          <dd>{account.ethnicity}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd><Copy value={account.email} /></dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd><Copy value={account.phone} /></dd>
        </div>
        <div>
          <dt>Bio</dt>
          <dd>{account.bio}</dd>
        </div>
      </dl>
      <div class="button-row regenerate-actions">
        <Button
          variant="quiet"
          icon="refresh"
          loading={pending === 'name'}
          disabled={!!pending}
          onclick={() => regenerate('name')}>Generate name</Button
        ><Button
          variant="quiet"
          icon="refresh"
          loading={pending === 'bio'}
          disabled={!!pending}
          onclick={() => regenerate('bio')}>Generate bio</Button>
      </div>{/if}
  </section>
</div>

<style>
  .profile-grid {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 18px;
  }
  .portrait-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    height: fit-content;
  }
  .portrait {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 5px;
  }
  .regenerate-actions {
    margin-top: 15px;
  }
  @media (max-width: 1000px) {
    .profile-grid {
      grid-template-columns: 180px minmax(0, 1fr);
    }
  }
  @media (max-width: 650px) {
    .profile-grid {
      display: block;
    }
    .portrait-panel {
      margin-bottom: 18px;
    }
    .portrait {
      width: 160px;
    }
  }
</style>
