<script lang="ts">
  import {EditIcon, TrashIcon, CancelIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<ul class="list-disc">
  <li>Change Information<ActionIcon icon={EditIcon} action={() => {}} title="Change Information" /></li>
  <li>Cancel identity<ActionIcon icon={CancelIcon} action={() => {}} title="Cancel identity" /></li>
  <li>Delete identity<ActionIcon icon={TrashIcon} action={() => {}} title="Delete identity" /></li>
</ul>
