curl -X POST "https://shadowself.io/api/phone/send-message/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "addressee": "+14155550000",
           "body": "Hello from the API!"
         }'
