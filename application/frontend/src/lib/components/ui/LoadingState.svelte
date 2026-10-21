<script lang="ts">
  let {label}: {label: string} = $props();
</script>

<div class="loading-placeholder" role="status" aria-live="polite" aria-busy="true">
  <span>{label}</span>
  <div class="skeleton-lines" aria-hidden="true"><i></i><i></i><i></i></div>
</div>

<style>
  .loading-placeholder {
    padding: 24px 0;
    color: var(--muted);
    font-size: 13px;
  }

  .skeleton-lines {
    display: grid;
    gap: 12px;
    margin-top: 18px;
  }

  .skeleton-lines i {
    height: 38px;
    border-radius: 5px;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--accent-light) 3.14%, transparent),
      color-mix(in srgb, var(--accent-light) 9.41%, transparent),
      color-mix(in srgb, var(--accent-light) 3.14%, transparent)
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s ease-in-out infinite;
  }

  .skeleton-lines i:last-child {
    width: 65%;
  }

  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-lines i {
      animation: none;
    }
  }
</style>
