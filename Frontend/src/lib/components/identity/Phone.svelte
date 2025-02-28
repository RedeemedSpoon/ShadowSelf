<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Phone Number</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send SMS" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete SMS" />
  </div>
</section>
<section>
  <li>Refresh</li>
  <li>Send SMS</li>
  <li>Delete SMS</li>
</section>
