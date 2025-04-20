import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;

const emailUUID = '<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>';
const apiUrl = `https://shadowself.io/api/email/fetch-reply/${identityId}`;

async function fetchEmailForReply() {
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
      params: {
        uuid: emailUUID,
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching email:', error.response?.data || error.message);
  }
}

fetchEmailForReply();
