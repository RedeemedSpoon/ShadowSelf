import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/phone/${identityId}`;

async function getMessages() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error retrieving messages: ';
    if (error.response) {
      const status = error.response.status;
      const data = JSON.stringify(error.response.data);
      message += `${status} - ${data}`;
    } else {
      message += error.message;
    }
    console.error(message);
  }
}

getMessages();
