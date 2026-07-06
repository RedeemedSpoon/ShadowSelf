import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityID = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/account/update-encryption/${identityID}`;

const reEncryptedPass1 = 'U2FsdGVkX1+NewKeyEncPassDataOne==';
const reEncryptedTotp1 = 'U2FsdGVkX1+NewKeyEncTotpDataOne==';
const reEncryptedPass2 = 'U2FsdGVkX1+NewKeyEncPassDataTwo==';

const payload = {
  accounts: [
    {id: 101, password: reEncryptedPass1, totp: reEncryptedTotp1},
    {id: 102, password: reEncryptedPass2},
  ],
};

async function updateEncryption() {
  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error updating encryption: ';
    const response = error && typeof error === 'object' ? Reflect.get(error, 'response') : null;
    if (response) {
      const status = Reflect.get(response, 'status');
      const data = JSON.stringify(Reflect.get(response, 'data'));
      message += `${status} - ${data}`;
    } else {
      message += error instanceof Error ? error.message : String(error);
    }
    console.error(message);
  }
}

updateEncryption();
