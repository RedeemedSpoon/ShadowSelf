import axios from 'axios';

const url = `https://shadowself.io/api/crypto/sweep-info/${process.env.IDENTITY_ID}`;
axios
  .post(
    url,
    {coin: 'btc', addresses: ['bc1q...', 'bc1p...']},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
