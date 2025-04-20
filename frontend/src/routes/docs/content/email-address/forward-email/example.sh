curl -X POST "https://shadowself.io/api/email/forward-email/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "uid": 105,
           "forward": "forward.recipient@another.com"
         }'
