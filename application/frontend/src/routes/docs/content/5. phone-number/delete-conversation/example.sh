curl -X DELETE "https://shadowself.io/api/phone/delete-conversation/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "addressee": "+14155550000"
         }'
