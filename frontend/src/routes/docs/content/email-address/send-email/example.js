import axios from 'axios';

const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/send-email/${identityId}`;

const pdfData = 'JVBERi0xLjcK...';
const payload = {
  to: 'recipient@example.com',
  subject: 'API Test Email',
  body: 'This is the <b>HTML</b> body of the test email.',
  inReplyTo: '<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>',
  references: ['<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>'],
  attachments: [{filename: 'document.pdf', data: pdfData}],
  draft: 123,
};

async function sendEmail() {
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
    let message = 'Error sending email: ';
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

sendEmail();
