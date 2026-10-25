<script lang="ts">
  import {API_METHOD_COLORS} from '$constant';

  let {method}: {method: string} = $props();
</script>

<span class="api-method" data-method={method} style:--method-color={API_METHOD_COLORS[method]}>{method}</span>

<style>
  .api-method {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 54px;
    min-height: 24px;
    padding: 4px 7px;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--method-color);
    background: color-mix(in srgb, var(--method-color) 11%, transparent);
    font:
      600 10px 'Fira Code Variable',
      monospace;
    line-height: 1.2;
  }
</style>
