import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/save-draft/${identityId}`;
const payload = {
  to: 'recipient@example.com',
  subject: 'Updated Draft Subject',
  body: 'Continuing to write this email...',
  attachments: [{filename: 'idea.txt', data: 'VGhpcyBpcyBteSB...'}],
  draft: 45,
};

async function saveDraft() {
  try {
    const response = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error saving draft: ';
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

saveDraft();
