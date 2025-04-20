import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/edit-account/${identityId}`;
const accountEntryId = 101;

async function editAccount() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }

  // IMPORTANT: Encrypt new password client-side first
  const newEncryptedPassword = 'U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==';

  const payload = {
    id: accountEntryId,
    username: 'jd_service_user_revised',
    password: newEncryptedPassword,
    website: 'https://service-updated.example.com',
    // Include totp, algorithm if updating TOTP
  };

  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error editing account:', error.response?.data || error.message);
  }
}

editAccount();
