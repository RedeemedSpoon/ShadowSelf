<p>Changes the encryption of the entire account vault and wallet in one transaction. The separate wallet-encryption endpoint has been removed.</p>
<h5>Request</h5>
<p>
  Retrieve the current accounts and identity, unlock every encrypted field with the current key, and encrypt them using the new key. Send the current <code
    >encryptionVersion</code
  >, every account ID with its encrypted <code>password</code> and <code>totp</code>, the encrypted wallet <code>blob</code>, and <code>keys</code> containing
  encrypted Monero <code>address</code>, <code>viewKey</code> and <code>spendKey</code>. Use explicit null for an absent TOTP secret.
</p>
<p>
  Ciphertext uses <code>v1.</code> followed by canonical base64 of a fresh 12-byte AES-GCM nonce and authenticated ciphertext including its 16-byte tag. Decoded envelopes
  must contain 29 to 4124 bytes. Encrypt on the client. Never send the master password or plaintext keys. The example ciphertext is illustrative.
</p>
<h5>Concurrency and response</h5>
<p>
  All account IDs must match the complete current vault. A missing or duplicate account, a concurrent edit, or a stale encryption version returns HTTP 409 and
  changes nothing. Malformed envelopes return HTTP 400. Successful updates return the saved accounts, wallet blob, Monero keys, and incremented encryption
  version.
</p>
<p>
  Replace the in-memory key only after success. Remove the old encrypted wallet cache and sync it again. A failed request must leave the current key and cached
  state available.
</p>
