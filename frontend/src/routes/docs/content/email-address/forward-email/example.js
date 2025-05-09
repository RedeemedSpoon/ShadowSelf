import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/forward-email/${identityId}`;
const payload = {
  uid: 105,
  forward: 'forward.recipient@another.com',
};

async function forwardEmail() {
  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 204 || typeof response.data === 'undefined') {
      console.log(`Request successful (Status: ${response.status})`);
    } else if (typeof response.data === 'object') {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log(response.data);
    }
  } catch (error) {
    let message = 'Error forwarding email: ';
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

forwardEmail();
