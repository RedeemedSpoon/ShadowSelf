import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/edit-account/${identityId}`;
const accountEntryId = 101;
const newEncryptedPassword = 'U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==';

const payload = {
  id: accountEntryId,
  username: 'jd_service_user_revised',
  password: newEncryptedPassword,
  website: 'https://service-updated.example.com',
};

async function editAccount() {
  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error editing account: ';
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

editAccount();
