import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/add-account/${identityId}`;

const encryptedPassword = 'U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=';
const encryptedTotp = 'U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=';

const payload = {
  username: 'forum_reader_12',
  password: encryptedPassword,
  website: 'https://communityforum.org',
  totp: encryptedTotp,
  algorithm: 'SHA256',
};

async function addAccount() {
  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error adding account: ';
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

addAccount();
