import axios from 'axios';

const url = `https://shadowself.io/api/identity/regenerate-bio/${process.env.IDENTITY_ID}`;
axios
  .patch(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
