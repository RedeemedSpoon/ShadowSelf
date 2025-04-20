curl -X PUT "https://shadowself.io/api/identity/update/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"name": "Jane Doe", "age": 33}'
