import axios from 'axios';

const apiKey = process.env.API_KEY;
const apiUrl = 'https://shadowself.io/api/proxy';

async function listProxies() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error listing proxies: ';
    if (error.response) {
      message += `${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else {
      message += error.message;
    }
    console.error(message);
  }
}

listProxies();
