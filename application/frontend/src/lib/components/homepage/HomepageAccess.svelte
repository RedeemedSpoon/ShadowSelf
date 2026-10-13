<script lang="ts">
  import logo from '$image/brands/shadowself/icon.svg';
  import {page} from '$app/state';
</script>

<section class="network-access chapter-width" data-reveal>
  <div>
    <h2>Website, extension,<br />and API.</h2>
    <p>
      Open an identity while browsing, manage it on the website, or automate it through the API. Each uses the same profiles, messages, and account records.
    </p>
    <a class="inline-link" href="/docs">Read the API documentation</a>
  </div>
  <div class="access-diagram">
    <div class="access-endpoints">
      <a href={page.data.user ? '/dashboard' : '/signup'}>Website<span>Manage the identity</span></a><a href="/extension"
        >Extension<span>Use it while browsing</span></a
      ><a href="/docs">API<span>Build your own workflow</span></a>
    </div>
    <div class="access-bus"></div>
    <div class="access-source"><img src={logo} alt="" /><span>One identity workspace</span></div>
  </div>
</section>

<style>
  .network-access {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 90px;
    align-items: center;
    padding-block: 100px 130px;
  }
  .network-access h2 {
    font-size: 43px;
    letter-spacing: -1.7px;
    margin-bottom: 25px;
  }
  .network-access p {
    font-size: 14px;
    margin-bottom: 27px;
  }
  .access-endpoints {
    display: flex;
    gap: 12px;
  }
  .access-endpoints a {
    flex: 1;
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
  .access-bus {
    height: 45px;
    margin-inline: 16%;
    border: 1px solid #527899;
    border-top: 0;
    position: relative;
  }
  .access-bus::before,
  .access-bus::after {
    content: '';
    position: absolute;
    left: 50%;
    height: 45px;
    width: 1px;
    background: #527899;
  }
  .access-bus::after {
    top: 100%;
    height: 26px;
  }
  .access-source {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin: 26px auto 20px;
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
      padding-block: 65px;
      gap: 45px;
    }
    .network-access h2 {
      font-size: 35px;
    }
    .access-endpoints {
      gap: 7px;
    }
    .access-endpoints a {
      font-size: 12px;
      padding: 17px 5px;
    }
    .access-endpoints span {
      font-size: 8px;
    }
  }
</style>
