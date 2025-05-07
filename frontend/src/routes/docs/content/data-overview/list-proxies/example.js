import axios from 'axios';
import process from 'process';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error('API_KEY missing.');
  process.exit(1);
}

const apiUrl = 'https://shadowself.io/api/proxy';

async function listProxies() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {Authorization: `Bearer ${apiKey}`, Accept: 'application/json'},
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error listing proxies:', error.response?.data || error.message);
  }
}

listProxies();
