import axios from 'axios';
import process from 'process';

// Assume 'your_encryption_function' exists for client-side encryption
// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/add-account/${identityId}`;

async function addAccount() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }

  // IMPORTANT: Encrypt plain data client-side first
  const encryptedPassword = 'U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=';
  const encryptedTotp = 'U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=';

  const payload = {
    username: 'forum_reader_12',
    password: encryptedPassword,
    website: 'https://communityforum.org',
    totp: encryptedTotp,
    algorithm: 'SHA256',
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error adding account:', error.response?.data || error.message);
  }
}

addAccount();
