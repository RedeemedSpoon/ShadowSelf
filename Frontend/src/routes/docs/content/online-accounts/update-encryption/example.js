import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/update-encryption/${identityId}`;

async function updateEncryption() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }

  // IMPORTANT: Fetch, decrypt old, re-encrypt new client-side first
  const reEncryptedPass1 = 'U2FsdGVkX1+NewKeyEncPassDataOne==';
  const reEncryptedTotp1 = 'U2FsdGVkX1+NewKeyEncTotpDataOne==';
  const reEncryptedPass2 = 'U2FsdGVkX1+NewKeyEncPassDataTwo==';

  const payload = {
    accounts: [
      {id: 101, password: reEncryptedPass1, totp: reEncryptedTotp1},
      {id: 102, password: reEncryptedPass2},
    ],
  };

  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error updating encryption:', error.response?.data || error.message);
  }
}

updateEncryption();
