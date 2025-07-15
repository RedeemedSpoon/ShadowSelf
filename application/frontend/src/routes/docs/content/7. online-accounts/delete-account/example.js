import axios from 'axios';

const url = `https://shadowself.io/api/account/delete-account/${process.env.IDENTITY_ID}`;
axios
  .delete(url, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
    data: {id: 103},
  })
  .then((res) => console.log(res.data));
