<script lang="ts">
  import dashboard from '$image/homepage/dashboard.webp';
  import CardContainer from '$component/aceternity/CardContainer.svelte';
  import CardBody from '$component/aceternity/CardBody.svelte';
  import CardItem from '$component/aceternity/CardItem.svelte';
  import Card from '$component/containers/Card.svelte';

  let isMouseEntered = $state(false);
</script>

<CardContainer bind:isMouseEntered className="inter-var">
  <CardBody className="max-md:hidden animate-shake relative flex w-[60vw] h-[35vh] md:w-150 md:h-137.5 group/card">
    <Card {isMouseEntered} animate={true} className="p-8 md:p-12">
      <CardItem {isMouseEntered} translateZ="70" className="text-xl font-bold text-primary-200">
        Make Yourself Invulnerable to the Internet
      </CardItem>
      <CardItem {isMouseEntered} translateZ="80" className="text-neutral-400 text-sm my-3 leading-relaxed max-h-37.5 overflow-hidden">
        Via our intitive dashboard, you can create and manage your identities. You can also customize your them to your likings (name,
        location, etc.) and rest easy knowing that you no longer fear mass-surveillance, fraud and other potential threats to you.
      </CardItem>
      <CardItem {isMouseEntered} translateZ="100" className="hidden md:block w-full mt-6 border border-neutral-600 rounded-lg">
        <img
          loading="lazy"
          src={dashboard}
          class="h-60 w-full rounded-xl object-top group-hover/card:shadow-xl"
          alt="Dashboard Simplified" />
      </CardItem>
      <CardItem {isMouseEntered} translateZ="50" className="absolute bottom-8 right-12 text-neutral-200 rounded-xl text-sm">
        Try now →
      </CardItem>
      <CardItem
        {isMouseEntered}
        translateZ="50"
        className="absolute bottom-6 left-12 text-neutral-200 px-4 py-2 rounded-md bg-primary-700 text-sm">
        Sign up
      </CardItem>
    </Card>
  </CardBody>
</CardContainer>
