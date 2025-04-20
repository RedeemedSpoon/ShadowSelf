import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/phone/delete-conversation/${identityId}`;

const payload = {
  addressee: '+14155550000',
};

async function deleteConversation() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }
  try {
    const response = await axios.delete(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    console.log('Delete successful. Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error deleting conversation:', error.response?.data || error.message);
  }
}

deleteConversation();
