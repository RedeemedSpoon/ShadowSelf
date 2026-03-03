<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import {Html5Qrcode} from 'html5-qrcode';

  interface Props {
    onScan: (decodedText: string) => void;
    sweepWallet?: boolean;
    close: () => void;
  }

  let {onScan, close, sweepWallet = false}: Props = $props();
  let qrCode: Html5Qrcode | null = $state(null);
  let scannerId = 'reader';

  onMount(async () => {
    qrCode = new Html5Qrcode(scannerId);
    await qrCode.start(
      {facingMode: 'environment'},
      {fps: 10, qrbox: {width: 250, height: 250}},
      (decodedText) => (onScan(decodedText), stopCamera()),
      (_) => {},
    );
  });

  async function stopCamera() {
    if (qrCode && qrCode.isScanning) {
      await qrCode.stop();
      qrCode.clear();
      close();
    }
  }

  async function handleFileUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const imageFile = target.files[0];

    if (qrCode && qrCode.isScanning) {
      await qrCode.stop();
    }

    const fileScanner = new Html5Qrcode('file-reader-hidden');
    try {
      const decodedText = await fileScanner.scanFileV2(imageFile, true);
      onScan(decodedText as unknown as string);
      close();
    } catch (err) {
      close();
    }
  }

  const title = $derived(sweepWallet ? 'Scan Private Key' : 'Scan Address QR Code');
  const explainer = $derived(
    sweepWallet
      ? 'Point your camera at the Private Key (WIF) QR code to import funds.'
      : 'Point your camera at a QR code to fill the address automatically.',
  );
  onDestroy(() => stopCamera());
</script>

<div id="backdrop" onclick={() => stopCamera()} aria-hidden="true" class={qrCode?.isScanning ? 'hidden' : 'no-scroll'}></div>
<div id="scanner">
  <div class="relative w-full overflow-hidden">
    <h3 class="w-full p-4 pt-1 text-center text-2xl font-bold text-neutral-300">{title}</h3>
    <div id={scannerId} class="mt-4 bg-neutral-800"></div>
    <div id="file-reader-hidden" class="hidden"></div>
    <div class="flex flex-col gap-3 p-4">
      <p class="mb-2 text-center text-xs text-neutral-500">{explainer}</p>
      <div class="relative">
        <button class="w-full py-3 text-lg font-medium">Or Upload Image File</button>
        <input type="file" accept="image/*" class="absolute inset-0 cursor-pointer opacity-0" onchange={handleFileUpload} />
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "$style";

  #backdrop {
    @apply fixed inset-0 z-50 h-full w-full bg-black/40;
  }

  #scanner {
    @apply fixed inset-0 z-60 m-auto flex h-fit w-fit max-w-md items-center justify-center self-center;
    @apply rounded-xl bg-neutral-800/95 px-8 py-4 shadow-2xl shadow-gray-950/50 backdrop-blur-xs max-sm:mx-4 sm:px-16 sm:py-8;
  }
</style>
