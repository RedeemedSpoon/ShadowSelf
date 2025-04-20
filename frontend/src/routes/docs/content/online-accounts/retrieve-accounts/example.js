import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/${identityId}`;

async function getAccounts() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    // Remember to decrypt password/totp fields client-side
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error retrieving accounts:', error.response?.data || error.message);
  }
}

getAccounts();
