const response = await fetch(`https://shadowself.io/api/account/update-encryption/${process.env.IDENTITY_ID}`, {
  method: 'PUT',
  headers: {Authorization: `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({
    encryptionVersion: 1,
    accounts: [
      {
        id: 101,
        password: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
        totp: null,
      },
    ],
    blob: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
    keys: {
      address: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
      viewKey: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
      spendKey: 'v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
    },
  }),
});

if (!response.ok) throw new Error(await response.text());
console.log(await response.json());
