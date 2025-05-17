import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const addresseePhone = '+14155550000';
const apiUrl = `https://shadowself.io/api/phone/fetch-conversation/${identityId}`;

async function fetchConversation() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      params: {addressee: addresseePhone},
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error fetching conversation: ';
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

fetchConversation();
