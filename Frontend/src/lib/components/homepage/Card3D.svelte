<script lang="ts">
  import {CardBody, CardContainer, CardItem} from '$components';
  import {dashboard} from '$images';

  let isMouseEntered = false;
</script>

<CardContainer bind:isMouseEntered className="inter-var">
  <CardBody className="animate-shake relative group/card w-[600px] h-[550px] p-12 border border-neutral-500 card">
    <CardItem {isMouseEntered} translateZ="70" className="text-xl font-bold text-primary-200" >
      Make Yourself Invulnerable to the Internet
    </CardItem>
    <CardItem {isMouseEntered} translateZ="80" className="text-neutral-400 text-sm my-3 leading-relaxed">
      Via our intitive dashboard, you can create and manage your identities. You can also customize your them to your
      likings (name, location, etc.) and rest easy knowing that you no longer fear mass-surveillance, fraud and other
      potential threats to you.
    </CardItem>
    <CardItem {isMouseEntered} translateZ="100" className="w-full mt-6 border border-neutral-600 rounded-lg">
      <img
        src={dashboard}
        class="h-60 w-full rounded-xl object-top group-hover/card:shadow-xl"
        alt="Dashboard Simplified" />
    </CardItem>
    <div class="mt-8 flex items-center justify-between px-4 text-neutral-200">
      <CardItem {isMouseEntered} translateZ={50} className="rounded-xl text-sm">Try now →</CardItem>
      <CardItem {isMouseEntered} translateZ={50} className="px-4 py-2 rounded-md bg-primary-700 text-sm">
        Sign up
      </CardItem>
    </div>
  </CardBody>
</CardContainer>
