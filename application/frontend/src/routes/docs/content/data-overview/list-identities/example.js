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
    let errorMessage = 'Fetch error: ';
    if (error.response && error.response.data) {
      errorMessage += JSON.stringify(error.response.data);
    } else {
      errorMessage += error.message;
    }
    console.error(errorMessage);
  }
}

listIdentities();
