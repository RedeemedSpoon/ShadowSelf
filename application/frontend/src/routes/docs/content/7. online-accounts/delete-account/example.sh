ACCOUNT_ENTRY_ID=103

curl -X DELETE "https://shadowself.io/api/account/delete-account/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "id": '$ACCOUNT_ENTRY_ID'
         }'
