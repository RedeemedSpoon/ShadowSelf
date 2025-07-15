import axios from 'axios';

const url = `https://shadowself.io/api/phone/fetch-conversation/${process.env.IDENTITY_ID}`;
axios
  .get(url, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
    params: {addressee: '+14155550000'},
  })
  .then((res) => console.log(res.data));
