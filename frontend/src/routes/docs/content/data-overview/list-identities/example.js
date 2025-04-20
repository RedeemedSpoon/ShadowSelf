import axios from 'axios';
const apiKey = process.env.API_KEY;
const apiUrl = 'https://shadowself.io/api/';

async function listIdentities() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching identities:', error.response?.data || error.message);
  }
}

listIdentities();
