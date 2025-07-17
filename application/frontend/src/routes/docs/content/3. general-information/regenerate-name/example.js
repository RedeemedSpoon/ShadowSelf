import axios from 'axios';

const url = `https://shadowself.io/api/identity/regenerate-name/${process.env.IDENTITY_ID}`;
axios
  .patch(
    url,
    {sex: 'male'},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
