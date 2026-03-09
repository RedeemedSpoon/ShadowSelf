import axios from 'axios';

const url = `https://shadowself.io/api/crypto/update-encryption/${process.env.IDENTITY_ID}`;
axios
  .put(
    url,
    {blob: 'U2FsdGVkX19nb...', keys: {address: 'YH5eD5e2T...'}},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
