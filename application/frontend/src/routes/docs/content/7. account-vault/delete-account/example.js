const response = await fetch(`https://shadowself.io/api/account/delete-account/${process.env.IDENTITY_ID}`, {
  method: 'DELETE',
  headers: {Authorization: `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({
    encryptionVersion: 1,
    id: 101,
  }),
});

if (!response.ok) throw new Error(await response.text());
console.log(await response.json());
