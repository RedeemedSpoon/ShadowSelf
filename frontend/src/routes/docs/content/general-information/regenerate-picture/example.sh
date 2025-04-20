curl -X PATCH "https://shadowself.io/api/identity/regenerate-picture/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"age": 25, "ethnicity": "asian"}'
