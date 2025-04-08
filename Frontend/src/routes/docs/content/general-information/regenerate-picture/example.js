import axios from 'axios';
// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/identity/regenerate-picture/${identityId}`;

// Optional payload: Specify fields or send empty object {}
const payload = {age: 25, ethnicity: 'asian'};

async function regeneratePicture() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID environment variables must be set.');
    return;
  }
  try {
    const response = await axios.patch(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error regenerating picture:', error.response?.data || error.message);
  }
}

regeneratePicture();
