import axios from 'axios';

const url = `https://shadowself.io/api/phone/delete-conversation/${process.env.IDENTITY_ID}`;
axios
  .delete(url, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
    data: {addressee: '+14155550000'},
  })
  .then((res) => console.log(res.data));
