import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const mailbox = 'INBOX';
const sinceUid = 104;
const apiUrl = `https://shadowself.io/api/email/load-more/${identityId}`;

async function loadMoreEmails() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      params: {mailbox: mailbox, since: sinceUid},
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    let message = 'Error loading more emails: ';
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

loadMoreEmails();
