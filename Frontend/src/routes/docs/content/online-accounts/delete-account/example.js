import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/delete-account/${identityId}`;
const accountEntryId = 103;

const payload = {
  id: accountEntryId,
};

async function deleteAccount() {
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
    console.error('Error deleting account:', error.response?.data || error.message);
  }
}

deleteAccount();
