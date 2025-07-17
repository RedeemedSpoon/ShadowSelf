import axios from 'axios';

const url = `https://shadowself.io/api/account/${process.env.IDENTITY_ID}`;
axios
  .get(url, {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      Accept: 'application/json',
    },
  })
  .then((res) => console.log(res.data));
