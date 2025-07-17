import axios from 'axios';

const url = `https://shadowself.io/api/identity/update/${process.env.IDENTITY_ID}`;
axios
  .put(
    url,
    {name: 'Jane Doe', age: 33},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
