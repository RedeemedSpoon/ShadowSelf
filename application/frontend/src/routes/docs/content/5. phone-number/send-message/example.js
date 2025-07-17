import axios from 'axios';

const url = `https://shadowself.io/api/phone/send-message/${process.env.IDENTITY_ID}`;
axios
  .post(
    url,
    {addressee: '+14155550000', body: 'Hello from the Node.js API script!'},
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )
  .then((res) => console.log(res.data));
