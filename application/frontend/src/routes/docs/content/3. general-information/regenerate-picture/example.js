import axios from 'axios';

const url = `https://shadowself.io/api/identity/regenerate-picture/${process.env.IDENTITY_ID}`;
axios
  .patch(
    url,
    {age: 25, ethnicity: 'asian'},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
