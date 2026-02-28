import axios from 'axios';

const url = `https://shadowself.io/api/crypto/update-blob/${process.env.IDENTITY_ID}`;
axios
  .put(
    url,
    {blob: 'U2FsdGVkX19nb...'},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
