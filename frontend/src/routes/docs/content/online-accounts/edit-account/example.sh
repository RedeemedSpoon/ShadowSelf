ACCOUNT_ENTRY_ID=101
NEW_ENCRYPTED_PASS="U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe=="

curl -X PUT "https://shadowself.io/api/account/edit-account/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "id": '$ACCOUNT_ENTRY_ID',
           "username": "jd_service_user_revised",
           "password": "'"$NEW_ENCRYPTED_PASS"'",
           "website": "https://service-updated.example.com"
         }'
