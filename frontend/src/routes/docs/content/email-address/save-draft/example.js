import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/save-draft/${identityId}`;

const payload = {
  to: 'recipient@example.com',
  subject: 'Updated Draft Subject',
  body: 'Continuing to write this email...',
  attachments: [{filename: 'idea.txt', data: 'VGhpcyBpcyBteSB...'}],
  draft: 45,
};

async function saveDraft() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
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
    console.error('Error saving draft:', error.response?.data || error.message);
  }
}

saveDraft();
