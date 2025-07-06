<p>
  Saves an email composition as a draft in 'Drafts'. Can replace an existing draft if its UID is provided (<span class="optional"
    >optional</span> <code>draft</code> field). Saves recipients, subject, body, attachments, and threading headers.
</p>

<h5>Request</h5>
<p>Requires identity <code>:id</code> path parameter and JSON payload with draft details. Uses PUT.</p>
<ul>
  <li>
    <code>draft</code> (<span class="integer">integer</span>, <span class="optional">optional</span>): UID of existing draft to
    replace. Omit to create new.
  </li>
  <li><code>to</code> (<span class="string">string</span>): Draft recipient.</li>
  <li><code>subject</code> (<span class="string">string</span>): Draft subject.</li>
  <li><code>body</code> (<span class="string">string</span>): Draft body.</li>
  <li>
    <code>inReplyTo</code> (<span class="string">string</span>, <span class="optional">optional</span>): Draft In-Reply-To header
    (Message-ID format).
  </li>
  <li>
    <code>references</code> (<span class="array">array</span>, <span class="optional">optional</span>): Draft References header (array
    of Message-IDs).
  </li>
  <li>
    <code>attachments</code> (<span class="array">array</span>, <span class="optional">optional</span>): Draft attachments (array of
    objects with <code>filename</code> and <code>data</code>).
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns JSON payload confirming old draft replacement and details of the saved draft in 'Drafts'.</p>
<ul>
  <li><code>draft</code> (<span class="integer">integer</span>): UID of replaced draft, or null.</li>
  <li>
    <code>savedDraft</code> (<span class="object">object</span>): Details of the saved draft (includes `uid`, `messageID` (null),
    `mailbox` ("Drafts"), `from`, `to`, `subject`, `body`, `type`, `date`, `attachments`, `inReplyTo`, `references`).
  </li>
</ul>
