import axios from 'axios';

const url = `https://shadowself.io/api/account/add-account/${process.env.IDENTITY_ID}`;
const payload = {
  username: 'forum_reader_12',
  password: 'U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=',
  website: 'https://communityforum.org',
  totp: 'U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=',
  algorithm: 'SHA256',
};
axios
  .post(url, payload, {
    headers: {Authorization: `Bearer ${process.env.API_KEY}`},
  })
  .then((res) => console.log(res.data));
