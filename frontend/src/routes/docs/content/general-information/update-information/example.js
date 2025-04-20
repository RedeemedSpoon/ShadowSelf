import axios from 'axios';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/identity/update/${identityId}`;

// Payload contains only the fields to update
const payload = {name: 'Jane Doe', age: 33};

async function updateIdentity() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID environment variables must be set.');
    return;
  }
  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error updating identity:', error.response?.data || error.message);
  }
}

updateIdentity();
