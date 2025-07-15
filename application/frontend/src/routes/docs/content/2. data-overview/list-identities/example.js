import axios from 'axios';

axios
  .get('https://shadowself.io/api/', {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      Accept: 'application/json',
    },
  })
  .then((res) => console.log(res.data));
