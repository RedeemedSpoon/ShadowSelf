import axios from 'axios';

const url = `https://shadowself.io/api/email/load-more/${process.env.IDENTITY_ID}`;
axios
  .get(url, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
    params: {mailbox: 'INBOX', since: 104},
  })
  .then((res) => console.log(res.data));
