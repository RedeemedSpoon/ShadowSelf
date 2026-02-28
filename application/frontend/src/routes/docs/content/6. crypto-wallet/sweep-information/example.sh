curl -X POST "https://shadowself.io/api/crypto/sweep-info/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"coin": "btc", "addresses": ["bc1q...", "bc1p..."]}'