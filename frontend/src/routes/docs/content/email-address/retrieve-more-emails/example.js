import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;

const mailbox = 'INBOX';
// UID of the oldest email currently shown for INBOX
const sinceUid = 104;
const apiUrl = `https://shadowself.io/api/email/load-more/${identityId}`;

async function loadMoreEmails() {
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
        mailbox: mailbox,
        since: sinceUid, // UID reference point
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error loading more emails:', error.response?.data || error.message);
  }
}

loadMoreEmails();
