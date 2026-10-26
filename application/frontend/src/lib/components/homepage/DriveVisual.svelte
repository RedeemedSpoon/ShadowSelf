<script lang="ts">
  import Icon from '$component/ui/Icon.svelte';
  import portrait from '$image/profile-pictures/gabriel-costa.webp';
  import {HOMEPAGE_PANEL_IDENTITIES} from '$constant';
</script>

<div
  class="drive-art"
  aria-label={`${HOMEPAGE_PANEL_IDENTITIES.cloud.name}'s profile photo, document, and video downloading from the identity drive`}>
  <div class="download-source">
    <svg viewBox="0 0 72 58" fill="none" aria-hidden="true">
      <path
        d="M19 43H55a12 12 0 0 0 1-24A19 19 0 0 0 20 15 14 14 0 0 0 19 43Z"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round" />
    </svg>
    <div><strong>Identity drive</strong><span>Your files, ready to download</span></div>
  </div>
  <div class="download-stream" aria-hidden="true">
    {#each ['archive', 'image', 'document', 'video'] as kind, index (kind)}
      <svg viewBox="0 0 24 28" fill="none" style:animation-delay={`${index * -0.75}s`}>
        <path d="M4 2h10l6 6v18H4Z M14 2v6h6" />
        {#if kind === 'archive'}
          <path d="M10 3h3m-3 4h3m-3 4h3m-3 4h3 M10 19h3v4h-3Z" />
        {:else if kind === 'image'}
          <circle cx="9" cy="13" r="1.5" /><path d="m6 23 5-6 3 3 3-4 2 7Z" />
        {:else if kind === 'document'}
          <path d="M8 13h8m-8 4h8m-8 4h5" />
        {:else}
          <path d="m9 12 7 5-7 5Z" />
        {/if}
      </svg>
    {/each}
  </div>
  <div class="file-folder">
    <div class="folder-heading">
      <span><Icon name="folder" size={17} />Profile files</span><small>{HOMEPAGE_PANEL_IDENTITIES.cloud.name}</small>
    </div>
    <div class="file-tiles">
      <div class="file-tile">
        <div
          class="file-preview portrait"
          role="img"
          aria-label={`Fictional portrait of ${HOMEPAGE_PANEL_IDENTITIES.cloud.name}`}
          style:background-image={`url(${portrait})`}>
        </div>
        <span>profile.jpg</span>
      </div>
      <div class="file-tile">
        <div class="file-preview document"><Icon name="file" size={34} /></div>
        <span>notes.pdf</span>
      </div>
      <div class="file-tile">
        <div class="file-preview video"><Icon name="play" size={30} /></div>
        <span>intro.mp4</span>
      </div>
    </div>
    <div class="folder-footer">
      <Icon name="check" size={14} /><span>3 files, kept with this identity</span><span class="download-label"
        ><Icon name="download" size={12} />Download</span>
    </div>
  </div>
</div>

<style>
  .drive-art {
    width: 100%;
    max-width: 445px;
    padding: 15px 10px 10px;
    color: #fb923c;
  }
  .download-source {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
    color: var(--feature-cloud);
  }
  .download-source > svg {
    width: 72px;
    height: 58px;
    flex-shrink: 0;
  }
  .download-source strong {
    display: block;
    color: #fed7aa;
    font-size: 13px;
    font-weight: 500;
  }
  .download-source span {
    display: block;
    margin-top: 6px;
    color: #bd9b80;
    font-size: 10px;
  }
  .download-stream {
    display: flex;
    justify-content: space-between;
    width: 150px;
    height: 66px;
    margin: 0 auto 14px;
    color: var(--feature-cloud);
  }
  .download-stream > svg {
    width: 20px;
    height: 24px;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: file-download 3s ease-in infinite;
  }
  .file-folder {
    position: relative;
    border: 1px solid #fb923c60;
    border-radius: 0 10px 10px 10px;
    padding: 20px;
    background: linear-gradient(145deg, #3d2c2180, #191c29);
    box-shadow: 0 20px 45px #0004;
  }
  .file-folder::before {
    content: '';
    position: absolute;
    left: -1px;
    top: -16px;
    width: 38%;
    height: 16px;
    border: 1px solid #fb923c60;
    border-bottom: 0;
    border-radius: 7px 12px 0 0;
    background: #35291f;
  }
  .folder-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 19px;
  }
  .folder-heading > span {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    color: #fed7aa;
  }
  .folder-heading small {
    color: #a89282;
    font-size: 9px;
  }
  .file-tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .file-tile {
    min-width: 0;
    border: 1px solid #fb923c26;
    border-radius: 6px;
    background: #121b2a;
    overflow: hidden;
  }
  .file-preview {
    height: 92px;
    display: grid;
    place-items: center;
    background: #fb923c06;
    color: var(--feature-cloud);
  }
  .portrait {
    background-size: cover;
    background-position: center;
  }
  .file-tile > span {
    display: block;
    padding: 10px 4px;
    text-align: center;
    font-size: 9px;
    color: #d0c6be;
  }
  .folder-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 17px;
    font-size: 9px;
    color: #bc9d83;
  }
  .download-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    color: var(--feature-cloud);
  }
  @keyframes file-download {
    from {
      transform: translateY(0);
      opacity: 0;
    }
    15%,
    85% {
      opacity: 1;
    }
    to {
      transform: translateY(42px);
      opacity: 0;
    }
  }
  @media (max-width: 380px) {
    .file-folder {
      padding: 15px;
    }
    .file-tiles {
      gap: 7px;
    }
    .file-preview {
      height: 75px;
    }
    .folder-footer {
      flex-wrap: wrap;
      gap: 7px;
    }
  }
</style>
