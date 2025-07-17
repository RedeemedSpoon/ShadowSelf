import axios from 'axios';

const url = `https://shadowself.io/api/email/save-draft/${process.env.IDENTITY_ID}`;
const payload = {
  to: 'recipient@example.com',
  subject: 'Updated Draft Subject',
  body: 'Continuing to write this email...',
  attachments: [{filename: 'idea.txt', data: 'VGhpcyBpcyBteSB...'}],
  draft: 45,
};
axios
  .put(url, payload, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
  })
  .then((res) => console.log(res.data));
