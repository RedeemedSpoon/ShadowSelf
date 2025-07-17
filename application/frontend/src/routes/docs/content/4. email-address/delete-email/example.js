import axios from 'axios';

const url = `https://shadowself.io/api/email/delete-email/${process.env.IDENTITY_ID}`;
axios
  .delete(url, {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: {
      mailbox: 'INBOX',
      uid: 105,
    },
  })
  .then((res) => console.log(res.data));
