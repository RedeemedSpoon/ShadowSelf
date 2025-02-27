<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<ul class="list-disc">
  <li>Refresh<ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" /></li>
  <li>Send SMS<ActionIcon icon={SendIcon} action={() => {}} title="Send SMS" /></li>
  <li>Delete SMS<ActionIcon icon={TrashIcon} action={() => {}} title="Delete SMS" /></li>
</ul>
