<script lang="ts">
  import {TransferIcon, RepeatIcon, AddFundsIcon, RetrieveFundsIcon} from '$icon';
  import {ActionIcon} from '$component';
</script>

<ul class="list-disc">
  <li>Add Funds<ActionIcon icon={AddFundsIcon} action={() => {}} title="Add Funds" /></li>
  <li>Retrieve Funds<ActionIcon icon={RetrieveFundsIcon} action={() => {}} title="Retrieve Funds" /></li>
  <li>Transfer Funds<ActionIcon icon={TransferIcon} action={() => {}} title="Transfer Funds" /></li>
  <li>Refresh<ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" /></li>
</ul>
