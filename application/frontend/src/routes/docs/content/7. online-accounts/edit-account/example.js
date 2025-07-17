import axios from 'axios';

const url = `https://shadowself.io/api/account/edit-account/${process.env.IDENTITY_ID}`;
const payload = {
  id: 101,
  username: 'jd_service_user_revised',
  password: 'U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==',
  website: 'https://service-updated.example.com',
};
axios
  .put(url, payload, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
  })
  .then((res) => console.log(res.data));
