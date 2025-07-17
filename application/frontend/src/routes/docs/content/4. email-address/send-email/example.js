import axios from 'axios';

const url = `https://shadowself.io/api/email/send-email/${process.env.IDENTITY_ID}`;
const payload = {
  to: 'recipient@example.com',
  subject: 'API Test Email',
  body: 'This is the <b>HTML</b> body of the test email.',
  inReplyTo: '<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>',
  references: ['<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>'],
  attachments: [{filename: 'document.pdf', data: 'JVBERi0xLjcK...'}],
  draft: 123,
};
axios
  .post(url, payload, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
  })
  .then((res) => console.log(res.data));
