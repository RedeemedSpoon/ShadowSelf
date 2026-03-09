curl -X PUT "https://shadowself.io/api/crypto/update-encryption/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"blob": "U2FsdGVkX19nb...","keys": {"address": "YH5eD5e2T..."}}'
