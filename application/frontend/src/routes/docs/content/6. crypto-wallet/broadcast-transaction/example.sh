curl -X POST "https://shadowself.io/api/crypto/broadcast/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"hex": "0200000001...", "coin": "btc"}'