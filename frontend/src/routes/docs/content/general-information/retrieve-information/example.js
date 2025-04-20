import axios from 'axios';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/identity/${identityId}`;

async function getIdentity() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID environment variables must be set.');
    return;
  }

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error retrieving identity:', error.response?.data || error.message);
  }
}

getIdentity();
