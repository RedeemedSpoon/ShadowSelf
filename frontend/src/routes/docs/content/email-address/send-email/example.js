import axios from 'axios';
import process from 'process';

// Requires API_KEY and IDENTITY_ID environment variables
const apiKey = process.env.API_KEY;
const identityId = process.env.IDENTITY_ID;
const apiUrl = `https://shadowself.io/api/email/send-email/${identityId}`;

async function sendEmail() {
  if (!apiKey || !identityId) {
    console.error('Error: API_KEY and IDENTITY_ID env vars must be set.');
    process.exit(1);
  }

  const pdfData = 'JVBERi0xLjcK...';

  const payload = {
    to: 'recipient@example.com',
    subject: 'API Test Email',
    body: 'This is the <b>HTML</b> body of the test email.',
    inReplyTo: '<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>',
    references: ['<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>'],
    attachments: [
      {
        filename: 'document.pdf',
        data: pdfData,
      },
    ],
    draft: 123,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
  }
}

sendEmail();
