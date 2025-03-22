<script lang="ts">
  import {type Writable} from 'svelte/store';
  import type {FetchAPI} from '$type';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    target: Writable<FetchAPI['sentMessages'][number] | null>;
    ws: WebSocket;
  }

  let {ws, mode, target}: Props = $props();
</script>

{#if $mode === 'write' || $mode === 'reply'}
  <p>{$target?.to}</p>
{/if}

<style lang="postcss">
</style>
