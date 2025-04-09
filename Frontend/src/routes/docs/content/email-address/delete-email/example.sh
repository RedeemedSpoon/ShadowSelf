curl -X DELETE "https://shadowself.io/api/email/delete-email/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "mailbox": "INBOX",
           "uid": 105
         }'
