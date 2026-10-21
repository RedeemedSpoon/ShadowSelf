<script lang="ts">
  import logo from '$image/brands/shadowself/icon.svg';
  import {page} from '$app/state';
</script>

<div class="network-access" data-reveal>
  <div>
    <h3>Website, extension, and API.</h3>
    <p>
      Open an identity while browsing, manage it on the website, or automate it through the API. Each uses the same
      profiles, messages, and account records.
    </p>
    <a class="inline-link" href="/docs">Read the API documentation</a>
  </div>
  <div class="access-diagram">
    <div class="access-endpoints">
      <a href={page.data.user ? '/dashboard' : '/signup'}>Website<span>Manage the identity</span></a><a
        href="/extension">Extension<span>Use it while browsing</span></a
      ><a href="/docs">API<span>Build your own workflow</span></a>
    </div>
    <svg class="access-connections" viewBox="0 0 600 68" preserveAspectRatio="none" fill="none" aria-hidden="true"
      ><path d="M100 0V35H500V0M300 0V68" /></svg>
    <div class="access-source"><img src={logo} alt="" /><span>One identity workspace</span></div>
  </div>
</div>

<style>
  .network-access {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 90px;
    align-items: center;
    padding-top: 65px;
    margin-top: 65px;
    border-top: 1px solid #64748b29;
  }
  .network-access h3 {
    font-size: 30px;
    letter-spacing: -1px;
    font-weight: 500;
    line-height: 1.3;
    color: #e0e7ff;
    margin-bottom: 25px;
  }
  .network-access p {
    font-size: 14px;
    margin-bottom: 27px;
  }
  .access-endpoints {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .access-endpoints a {
    margin-inline: 6px;
    font-size: 14px;
    color: #c7d2fe;
    padding: 20px 8px;
    text-align: center;
    border: 1px solid #476d8d66;
    border-radius: 7px;
    background: #151b34;
  }
  .access-endpoints span {
    display: block;
    font-size: 9px;
    color: #84a2bd;
    margin-top: 8px;
  }
  .access-connections {
    display: block;
    width: 100%;
    height: 68px;
    overflow: visible;
    stroke: #8caed5;
    stroke-width: 1.5;
  }
  .access-connections path {
    vector-effect: non-scaling-stroke;
  }
  .access-source {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin: 0 auto 20px;
    border: 1px solid #6670b168;
    background: #1d2345;
    border-radius: 8px;
    padding: 18px;
    max-width: 270px;
    font-size: 13px;
    color: #c4d2f4;
  }
  .access-source img {
    width: 28px;
    height: 28px;
  }
  @media (max-width: 1050px) {
    .network-access {
      gap: 40px;
    }
  }
  @media (max-width: 700px) {
    .network-access {
      grid-template-columns: 1fr;
      padding-top: 40px;
      margin-top: 40px;
      gap: 45px;
    }
    .network-access h3 {
      font-size: 28px;
    }
    .access-endpoints a {
      position: relative;
      font-size: 12px;
      padding: 17px 5px;
    }
    .access-endpoints span {
      font-size: 8px;
    }
  }
</style>
