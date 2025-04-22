<script lang="ts">
  import {Tooltip} from '$component';
  import {profilePictures} from '$image';

  const avatars = [
    {
      image: profilePictures[0],
      description: 'Mark Thompson\nLondon, United Kingdom 🇬🇧',
      position: 'bottom-48 left-16',
      size: 21,
    },
    {
      image: profilePictures[1],
      description: 'Sophie Miller\nWarsaw, Poland 🇵🇱',
      position: 'top-24 -left-24',
      size: 18,
    },
    {
      image: profilePictures[2],
      description: 'Isabella Garcia\nToronto, Canada 🇨🇦',
      position: 'top-32 left-40',
      size: 13,
    },
    {
      image: profilePictures[3],
      description: 'Andre Jackson\nStockholm, Sweden 🇸🇪',
      position: '-top-12 right-16',
      size: 11,
    },
    {
      image: profilePictures[4],
      description: 'Kenji Tanaka\nLondon, United Kingdom 🇬🇧',
      position: '-top-8 right-64',
      size: 14,
    },
    {
      image: profilePictures[5],
      description: 'Layla Hassan\nToronto, Canada 🇨🇦',
      position: '-left-48 bottom-56',
      size: 16,
    },
    {
      image: profilePictures[6],
      description: 'Peter Clark\nWarsaw, Poland 🇵🇱',
      position: 'right-72 top-40',
      size: 12,
    },
  ];
</script>

<div class="w-2/3 pl-[10vw] max-xl:hidden">
  {#each avatars as avatar}
    {@const style = `width: ${avatar.size * 0.65}rem; height: ${avatar.size * 0.65}rem`}
    <div class={'relative ' + avatar.position}>
      <Tooltip nowrap={true} tip={avatar.description} alt={true} onTop={false}>
        <img {style} src={avatar.image} alt={avatar.description} loading="lazy" />
      </Tooltip>
    </div>
  {/each}
</div>

<style lang="postcss">
  @reference "tailwindcss";

  img {
    @apply border-primary-600 absolute max-w-fit cursor-pointer rounded-full border-4 shadow-xl;
    @apply transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-neutral-950;
  }
</style>
