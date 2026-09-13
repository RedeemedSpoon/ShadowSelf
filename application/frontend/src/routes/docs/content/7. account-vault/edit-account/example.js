const response = await fetch(`https://shadowself.io/api/account/edit-account/${process.env.IDENTITY_ID}`, {
  method: 'PUT',
  headers: {Authorization: `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({
    vaultRevision: 1,
    id: 101,
    username: 'example',
    password: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
    website: 'https://example.com',
    totp: null,
    algorithm: null,
  }),
});

if (!response.ok) throw new Error(await response.text());
console.log(await response.json());
