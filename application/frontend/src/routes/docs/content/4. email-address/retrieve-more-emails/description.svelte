<p>
  Fetches the next batch of emails (up to 7) from a specific mailbox, used for pagination. Requires specifying the mailbox and the UID
  (`since`) of the oldest email currently loaded for that mailbox. The API returns emails with UIDs lower than the provided `since`
  value.
</p>

<h5>Request</h5>
<p>
  Requires the identity <code>:id</code> as a path parameter and query parameters to specify the mailbox and pagination reference point.
</p>
<ul>
  <li>
    <code>mailbox</code> (Query Parameter, <span class="string">string</span>): The name of the mailbox to fetch from (e.g., "INBOX",
    "Sent", "Drafts", "Junk").
  </li>
  <li>
    <code>since</code> (Query Parameter, <span class="integer">integer</span>): The UID of the oldest email currently fetched/displayed
    for this mailbox. The API will fetch the next batch of emails older than (i.e., with UIDs less than) this value.
  </li>
</ul>

<h5>Response Body</h5>
<p>
  Returns a JSON payload containing the mailbox queried, the 'since' UID used, and an array of the next batch of emails found (up to
  7).
</p>
<ul>
  <li><code>mailbox</code> (<span class="string">string</span>): The mailbox that was queried.</li>
  <li><code>since</code> (<span class="integer">integer</span>): The UID used as the reference point for fetching.</li>
  <li>
    <code>nextEmails</code> (<span class="array">array</span>): An array containing the next batch of email objects fetched. The
    structure of each email object is the same as described in "Retrieve Recent Emails". Returns an empty array if no older emails are
    found.
  </li>
</ul>
