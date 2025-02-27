<script lang="ts">
  import {UserAddIcon, UserEditIcon, UserDeleteIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<ul class="list-disc">
  <li>Add Accounts<ActionIcon icon={UserAddIcon} action={() => {}} title="Add Accounts" /></li>
  <li>Change Accounts<ActionIcon icon={UserEditIcon} action={() => {}} title="Change Accounts" /></li>
  <li>Delete Accounts<ActionIcon icon={UserDeleteIcon} action={() => {}} title="Delete Accounts" /></li>
</ul>
