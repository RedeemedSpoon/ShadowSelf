<script lang="ts">
  import {CardBody, CardContainer, CardItem} from '$components';
  import {dashboard} from '$images';

  let isMouseEntered = false;
</script>

<CardContainer bind:isMouseEntered className="inter-var">
  <CardBody
    className="shadow-2xl shadow-primary-900/[0.5] animate-shake relative group/card hover:shadow-8xl hover:shadow-primary-900/[0.3] border-black/[0.1] w-[600px] h-[550px] rounded-xl p-12 border border-neutral-500 bg-[#030923] transition-all duration-500">
    <CardItem {isMouseEntered} translateZ="70" className="text-xl font-bold text-neutral-200">
      Make Yourself Invulnerable to the Internet
    </CardItem>
    <CardItem {isMouseEntered} translateZ="80" className="text-neutral-500 text-sm my-3 leading-relaxed">
      Via our intitive dashboard, you can create your own profile and see your online presence. You can also customize
      your profile to your preferences (name, location, etc.). With us, you no longer fear mass-surveillance and other
      potential threats to you.
    </CardItem>
    <CardItem {isMouseEntered} translateZ="100" className="w-full mt-8 border border-neutral-600 rounded-lg">
      <img
        src={dashboard}
        class="h-60 w-full rounded-xl object-cover group-hover/card:shadow-xl"
        alt="Dashboard Simplified" />
    </CardItem>
    <div class="mt-10 flex items-center justify-between px-4 text-neutral-200">
      <CardItem {isMouseEntered} translateZ={50} className="rounded-xl text-sm">Try now →</CardItem>
      <CardItem {isMouseEntered} translateZ={50} className="px-4 py-2 rounded-md bg-primary-700 text-sm">
        Sign up
      </CardItem>
    </div>
  </CardBody>
</CardContainer>
