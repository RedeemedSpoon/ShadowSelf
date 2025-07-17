import axios from 'axios';

const url = `https://shadowself.io/api/email/fetch-reply/${process.env.IDENTITY_ID}`;
axios
  .get(url, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
    params: {uuid: '<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>'},
  })
  .then((res) => console.log(res.data));
