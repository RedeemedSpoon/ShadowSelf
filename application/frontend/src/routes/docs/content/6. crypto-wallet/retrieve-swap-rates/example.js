import axios from 'axios';

const url = `https://shadowself.io/api/crypto/swap-rates/${process.env.IDENTITY_ID}`;
axios
  .get(url, {
    params: {coinFrom: 'btc', coinTo: 'xmr', amount: 0.01},
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      Accept: 'application/json',
    },
  })
  .then((res) => console.log(res.data));
