curl -X PATCH "https://shadowself.io/api/identity/regenerate-name/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"sex": "male"}'
