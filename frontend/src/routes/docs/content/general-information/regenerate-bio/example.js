import axios from 'axios';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/identity/regenerate-bio/${identityId}`;

async function regenerateBio() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID environment variables must be set.');
    return;
  }
  try {
    // Send empty object as payload for PATCH
    const response = await axios.patch(
      apiUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error regenerating bio:', error.response?.data || error.message);
  }
}

regenerateBio();
