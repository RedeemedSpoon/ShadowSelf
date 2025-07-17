import axios from 'axios';

const url = `https://shadowself.io/api/email/forward-email/${process.env.IDENTITY_ID}`;
axios
  .post(url, {uid: 105, forward: 'forward.recipient@another.com'}, {headers: {Authorization: `Bearer ${process.env.API_KEY}`}})
  .then((res) => console.log(res.data));
