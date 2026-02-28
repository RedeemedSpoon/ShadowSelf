import axios from 'axios';

const url = `https://shadowself.io/api/crypto/broadcast/${process.env.IDENTITY_ID}`;
axios
  .post(
    url,
    {hex: '0200000001...', coin: 'btc'},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
