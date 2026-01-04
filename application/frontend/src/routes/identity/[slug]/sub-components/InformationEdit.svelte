<script lang="ts">
  import {ActionIcon, SelectMenu, Tooltip, LoadingButton} from '$component';
  import {FemaleIcon, MaleIcon, UserIcon, RepeatIcon} from '$icon';
  import {identity, fetchIndex} from '$store';
  import {fetchAPI} from '$fetch';
  import {notify} from '$lib';

  const ethnicities = ['Caucasian', 'Black', 'Hispanic', 'Slav', 'Arab', 'East asian', 'South asian'];

  async function regeneratePicture() {
    const bio = (document.querySelector('textarea') as HTMLTextAreaElement).value.trim();
    const age = Number((document.querySelector('input[name="age"]') as HTMLInputElement).value.trim());
    const ethnicity = (document.querySelector('input[name="ethnicity"]') as HTMLSelectElement).value;
    const sex = document.querySelector('.selected')?.id;

    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const response = await fetchAPI('identity/regenerate-picture', 'PATCH', {sex, age, ethnicity, bio});
    if (response.err) return notify(response.err, 'alert');

    const element = document.querySelector(`#profile`) as HTMLImageElement;
    element.src = `data:image/png;base64,${response.picture}`;
    $fetchIndex = 0;
  }

  async function regenerateName() {
    const sex = document.querySelector('.selected')!.id;
    const response = await fetchAPI('identity/regenerate-name', 'PATCH', {sex});
    if (response.err) return notify(response.err, 'alert');

    const element = document.querySelector(`input[name="name"]`) as HTMLInputElement;
    element.value = response.name!;
  }

  async function regenerateBio() {
    const response = await fetchAPI('identity/regenerate-bio', 'PATCH');
    const element = document.querySelector(`textarea`) as HTMLTextAreaElement;
    element.value = response.bio!;
  }

  function changeToMale() {
    document.querySelector(`#female`)!.classList.remove('selected');
    document.querySelector(`#male`)!.classList.add('selected');
  }

  function changeToFemale() {
    document.querySelector(`#male`)!.classList.remove('selected');
    document.querySelector(`#female`)!.classList.add('selected');
  }
</script>

<div class="grid place-items-center gap-8 md:m-12 md:gap-16 lg:grid-cols-2">
  <div class="flex flex-col items-center gap-8">
    <img
      id="profile"
      class="rounded-xl max-md:mt-4 max-md:w-3/4"
      src={`data:image/png;base64,${$identity.picture}`}
      alt="identity look" />
    <Tooltip
      tip="Regenerate the identity's profile picture based on the information you provided us. The bio will be taken into account">
      <LoadingButton onclick={regeneratePicture}>
        <UserIcon className="h-6 w-6 -mr-2" />Regenerate profile picture
      </LoadingButton>
    </Tooltip>
  </div>
  <div class="flex w-full flex-col gap-4">
    <div class="flex items-end gap-4">
      <label for="name">Name</label>
      <ActionIcon title="regenerate a random name" icon={RepeatIcon} action={regenerateName} size="small" />
    </div>
    <input value={$identity.name} type="text" placeholder="John Doe" name="name" />

    <label for="sex">Sex</label>
    <div class="flex flex-row gap-4">
      <div id="male" class="sex-box {$identity.sex === 'male' && 'selected'}" onclick={changeToMale} aria-hidden="true">
        <MaleIcon /> Male
      </div>
      <div id="female" class="sex-box {$identity.sex === 'female' && 'selected'}" onclick={changeToFemale} aria-hidden="true">
        <FemaleIcon /> Female
      </div>
    </div>

    <label for="ethnicity">Ethnicity</label>
    <SelectMenu options={ethnicities} name="ethnicity" value={$identity.ethnicity} />

    <label for="age">Age</label>
    <div class="group relative mb-6">
      <div id="age-feedback-popup" class="group-hover:opacity-100!" style="left: {(($identity.age - 18) / 42) * 100}%;">
        {$identity.age}
      </div>
      <input type="range" name="age" step={1} min={18} max={60} bind:value={$identity.age} />
      <span class="absolute start-0 -bottom-6">18</span>
      <span class="absolute end-0 -bottom-6">60</span>
    </div>

    <div class="flex items-end gap-4">
      <label for="bio">Bio</label>
      <ActionIcon title="regenerate a random bio" icon={RepeatIcon} action={regenerateBio} size="small" />
    </div>
    <textarea placeholder="Short bio, will be used when generating a profile picture" value={$identity.bio}></textarea>
  </div>
</div>

<style lang="postcss">
  @reference "$style";

  .sex-box {
    @apply flex h-12 w-1/2 items-center justify-center gap-px font-semibold transition-all duration-300 ease-in-out;
    @apply cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 hover:text-neutral-400;
  }

  .sex-box.selected {
    @apply bg-primary-600 text-neutral-300;
  }

  textarea {
    @apply h-32 resize-none;
  }

  input[type='range'] {
    @apply bg-primary-600 my-2 h-2 w-full cursor-pointer appearance-none rounded-lg [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-neutral-300 [&::-moz-range-thumb]:hover:bg-neutral-400 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:hover:bg-neutral-400;
  }

  #age-feedback-popup {
    @apply bg-primary-700 absolute -top-6 -translate-x-1/2 rounded px-2 py-1 text-xs font-bold text-neutral-300 opacity-0 transition-opacity duration-300;
  }
</style>
