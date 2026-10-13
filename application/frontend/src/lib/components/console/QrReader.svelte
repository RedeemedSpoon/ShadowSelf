<script lang="ts">
  import {onMount} from 'svelte';
  import Status from '$component/ui/Status.svelte';

  let {onread}: {onread: (value: string) => void} = $props();
  let id = `scanner-${crypto.randomUUID()}`;
  let error = $state('');

  onMount(() => {
    let scanner: import('html5-qrcode').Html5Qrcode;
    let cancelled = false;
    void (async () => {
      try {
        const module = await import('html5-qrcode');

        if (cancelled) {
          return;
        }

        scanner = new module.Html5Qrcode(id);
        await scanner.start(
          {facingMode: 'environment'},
          {fps: 8, qrbox: {width: 230, height: 230}},
          (value) => {
            onread(value);
          },
          () => {},
        );

        if (cancelled) {
          await scanner.stop();
        }
      } catch {
        error = 'Camera access failed. Paste the address or key instead.';
      }
    })();

    return () => {
      cancelled = true;

      if (scanner?.isScanning) {
        void scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  });
</script>

<div {id}></div>
<Status message={error} kind="error" />
