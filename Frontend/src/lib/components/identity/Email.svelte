<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<ul class="list-disc">
  <li>Refresh<ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" /></li>
  <li>Send Emails<ActionIcon icon={SendIcon} action={() => {}} title="Send Emails" /></li>
  <li>Delete Emails<ActionIcon icon={TrashIcon} action={() => {}} title="Delete Emails" /></li>
</ul>
