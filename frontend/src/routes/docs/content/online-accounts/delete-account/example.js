import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/delete-account/${identityId}`;
const accountEntryId = 103;
const payload = {id: accountEntryId};

async function deleteAccount() {
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
    let message = 'Error deleting account: ';
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

deleteAccount();
