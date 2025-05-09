import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const emailUUID = '<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>';
const apiUrl = `https://shadowself.io/api/email/fetch-reply/${identityId}`;

async function fetchEmailForReply() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      params: {uuid: emailUUID},
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error fetching email: ';
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

fetchEmailForReply();
