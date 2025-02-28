<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Online Accounts</h2>
  <div>
    <ActionIcon icon={UserAddIcon} action={() => {}} title="Add Accounts" />
    <ActionIcon icon={UserEditIcon} action={() => {}} title="Change Accounts" />
    <ActionIcon icon={UserDeleteIcon} action={() => {}} title="Delete Accounts" />
  </div>
</section>
<section>
  <li>Add Accounts</li>
  <li>Change Accounts</li>
  <li>Delete Accounts</li>
</section>
