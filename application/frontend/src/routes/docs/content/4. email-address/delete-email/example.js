import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/delete-email/${identityId}`;
const payload = {mailbox: 'INBOX', uid: 105};

async function deleteEmail() {
  try {
    const response = await axios.delete(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    if (response.status === 204 || !response.data) {
      console.log(`Delete successful (Status: ${response.status})`);
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    let message = 'Error deleting email: ';
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

deleteEmail();
