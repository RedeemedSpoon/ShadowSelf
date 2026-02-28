import axios from 'axios';

const url = `https://shadowself.io/api/crypto/swap-trades/${process.env.IDENTITY_ID}`;
axios
  .post(
    url,
    {
      tradeID: 'trade_12345',
      coinTo: 'xmr',
      coinFrom: 'btc',
      amount: 0.01,
      destinationAddress: '44AFFq...',
      refundAddress: 'bc1q...',
      provider: 'ProviderA',
      isFixed: false,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
