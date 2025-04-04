<script lang="ts">
  import type {PageData} from './$types';
  import {HTTPMethod} from '$component';
  import {formatCasing} from '$format';

  let {data}: {data: PageData} = $props();
</script>

<svelte:head>
  <title>ShadowSelf - API Documentation</title>
  <meta name="description" content="Make use of the ShadowSelf API to interact with our services programmatically with ease" />
</svelte:head>

<div id="docs">
  <ol class="max-h-[calc(100vh-12.5rem)]">
    {#each data.docs.sections as section}
      {@const Icon = section.icon}
      <ul class="mb-2 mt-6">
        <li class="flex items-center gap-2 text-nowrap text-3xl text-neutral-300">
          <Icon className="h-8 w-8 !stroke-neutral-300" fill={false} />
          {formatCasing(section.title)}
        </li>
        {#each section.more as subsection}
          <li class="my-[8px] ml-10 text-nowrap text-xl text-neutral-400">
            <HTTPMethod method={subsection.method} />
            {formatCasing(subsection.title)}
          </li>
        {/each}
      </ul>
    {/each}
  </ol>
  <span class="mr-12 w-px self-stretch bg-neutral-700"></span>
  <section class="flex w-full flex-col gap-8 self-stretch">
    <h2 class="mb-4 text-3xl text-neutral-300">Important Title</h2>
    <p>
      Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus
      mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum
      egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad
      litora torquent per conubia nostra inceptos himenaeos.
    </p>
    <p>
      Donec urna diam, ultrices eleifend quam luctus, posuere efficitur massa. Pellentesque ut nibh faucibus, dignissim odio at,
      tristique urna. In finibus, mi ac pharetra consequat, mi purus tristique ex, vitae pulvinar metus sem eget augue. Integer eu
      lacus id eros vestibulum condimentum. Duis mollis posuere viverra. Aenean condimentum, odio quis venenatis auctor, metus mi
      sollicitudin urna, facilisis euismod ex enim sit amet ipsum. Etiam ultrices felis erat. Morbi ex risus, gravida in nunc quis,
      egestas iaculis ante.
    </p>
    <p>
      Vivamus dictum tellus non aliquam suscipit. Aliquam velit eros, dictum id tincidunt id, convallis sit amet lorem. Ut ultrices
      ornare pharetra. Donec iaculis maximus turpis, a feugiat sapien mattis scelerisque. Pellentesque metus neque, feugiat ac euismod
      vel, viverra vel purus. Ut molestie eleifend nunc quis rhoncus. Proin justo magna, sollicitudin ut arcu quis, imperdiet efficitur
      lacus. Sed ipsum purus, tempus luctus euismod a, pellentesque vitae turpis.
    </p>
    <h2 class="mb-4 text-3xl text-neutral-300">Important Title</h2>
    <p>
      Morbi ex sapien, tempor ac luctus vel, tincidunt ac leo. Vestibulum iaculis arcu id eros mollis, ac lacinia lacus tincidunt.
      Suspendisse consectetur sapien vel malesuada vehicula. Cras rhoncus massa quis mi pellentesque, ac convallis est condimentum.
      Phasellus lacinia ut ante eu vulputate. Nullam ac odio at purus blandit iaculis. Nunc non tellus eros. Morbi augue leo, mattis ac
      quam a, iaculis porta ligula. Sed eget iaculis dui. Mauris non pretium justo, eget condimentum quam. Quisque facilisis ligula vel
      est bibendum, et pulvinar ex egestas. Suspendisse id mollis est. Vivamus lobortis, nibh quis suscipit sagittis, erat arcu
      hendrerit turpis, nec tempor velit metus in purus. Nulla eget ante ullamcorper, tristique nibh vel, dapibus arcu. Cras a ligula
      at quam gravida tincidunt.
    </p>
    <p>
      Duis ut quam ipsum. Suspendisse bibendum ac nisi tincidunt tempus. Pellentesque pharetra mollis dui congue mattis. Morbi rutrum
      enim ac nunc commodo elementum. Vestibulum accumsan ex a rutrum mollis. Quisque magna orci, vulputate malesuada ipsum feugiat,
      aliquam volutpat nunc. Nunc urna ipsum, laoreet a pharetra ut, faucibus a libero.
    </p>
    <p>
      Vivamus sit amet arcu scelerisque, facilisis ante non, imperdiet arcu. Integer placerat tortor nulla, vitae blandit nulla
      sollicitudin ac. Sed in quam mauris. Ut dignissim magna ac diam congue consequat. Integer vel lorem sed tellus facilisis
      tincidunt. Nulla quis dolor porttitor mauris hendrerit malesuada ac a leo. Mauris venenatis ipsum et pulvinar volutpat. Cras vel
      dolor aliquam, cursus eros ac, mollis libero. Maecenas dictum ornare nisl nec pulvinar. Duis pretium eros augue. Duis sed rhoncus
      risus.
    </p>
    <p>
      Suspendisse eget tempor massa. Phasellus malesuada ullamcorper finibus. Vivamus eget sodales tortor. Aenean accumsan sapien in
      purus venenatis pellentesque. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nunc
      eget vehicula quam. Phasellus posuere semper lacinia. Curabitur sapien lacus, blandit ac placerat in, eleifend quis justo.
    </p>
  </section>
</div>

<style lang="postcss">
  #docs {
    @apply mx-auto my-[12.5rem] flex w-5/6 text-neutral-400;
  }

  ol {
    @apply no-scrollbar sticky top-36 flex flex-shrink-0 flex-col self-start overflow-y-auto pr-12;
  }
</style>
